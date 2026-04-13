import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getCoinImageUrl } from '../utils/coinImages'
import { formatUSD } from '../utils/formatters'

function CoinLogo({ coinId, image, symbol, size = 44 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(coinId, image)
  if (!src || err) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0"
      >
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={symbol}
      onError={() => setErr(true)}
      style={{ width: size, height: size }}
      className="rounded-full bg-white/5 flex-shrink-0"
    />
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="px-3 py-1.5 rounded-lg border border-[#1E2025] bg-transparent text-[#8A8F98] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function SuccessModal({ airdrop, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-16 h-16 mx-auto mb-4">
          <CoinLogo coinId={airdrop.coin_id} image={airdrop.coin_image} symbol={airdrop.coin_symbol} size={64} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#05B169] flex items-center justify-center text-white text-sm font-bold">
            &#10003;
          </div>
        </div>
        <div className="text-white font-semibold text-lg mb-1">
          You received {Number(airdrop.amount).toLocaleString()} {airdrop.coin_symbol}!
        </div>
        <div className="text-[#8A8F98] text-sm mb-5">Added to your portfolio</div>
        <Link
          to="/portfolio"
          onClick={onClose}
          className="inline-block w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold no-underline transition-colors"
        >
          View portfolio
        </Link>
      </div>
    </div>
  )
}

export default function Airdrops() {
  const { user } = useAuth()
  const { holdings, refreshAll } = usePortfolio()
  const [airdrops, setAirdrops] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [successAirdrop, setSuccessAirdrop] = useState(null)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [{ data: aData }, { data: cData }] = await Promise.all([
        supabase.from('airdrops').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('airdrop_claims').select('*').eq('user_id', user.id),
      ])
      setAirdrops(aData || [])
      setClaims(cData || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  function hasClaimed(airdropId) {
    return claims.some((c) => c.airdrop_id === airdropId)
  }

  function claimDate(airdropId) {
    const c = claims.find((cl) => cl.airdrop_id === airdropId)
    return c ? new Date(c.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  }

  function isFull(a) {
    return a.max_claims && a.total_claimed >= a.max_claims
  }

  function isExpired(a) {
    return a.expires_at && new Date(a.expires_at) < new Date()
  }

  async function handleClaim(airdrop) {
    setError('')
    if (hasClaimed(airdrop.id)) { setError('Already claimed'); return }
    if (isFull(airdrop) || isExpired(airdrop)) return
    setClaiming(airdrop.id)
    try {
      // 1. Insert claim
      const { error: claimErr } = await supabase.from('airdrop_claims').insert({
        airdrop_id: airdrop.id,
        user_id: user.id,
        coin_id: airdrop.coin_id,
        coin_symbol: airdrop.coin_symbol,
        amount: airdrop.amount,
      })
      if (claimErr) {
        if (claimErr.code === '23505') { setError('Already claimed'); return }
        throw claimErr
      }

      // 2. Update holdings
      const existing = holdings.find((h) => h.coin_id === airdrop.coin_id)
      if (existing) {
        await supabase.from('holdings')
          .update({ quantity: Number(existing.quantity) + Number(airdrop.amount) })
          .eq('id', existing.id)
      } else {
        await supabase.from('holdings').insert({
          user_id: user.id,
          coin_id: airdrop.coin_id,
          symbol: airdrop.coin_symbol.toLowerCase(),
          name: airdrop.coin_name,
          image: airdrop.coin_image || null,
          quantity: airdrop.amount,
          buy_price_usd: 0,
        })
      }

      // 3. Transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'buy',
        coin_id: airdrop.coin_id,
        coin_symbol: airdrop.coin_symbol.toUpperCase(),
        quantity: airdrop.amount,
        price_usd: 0,
        total_usd: 0,
        fee_usd: 0,
      })

      // 4. Increment total_claimed
      await supabase.rpc('increment_airdrop_claimed', { airdrop_row_id: airdrop.id }).catch(() => {
        // Fallback if RPC doesn't exist
        supabase.from('airdrops')
          .update({ total_claimed: (airdrop.total_claimed || 0) + 1 })
          .eq('id', airdrop.id)
      })

      await refreshAll()
      await loadData()
      setSuccessAirdrop(airdrop)
    } catch (err) {
      setError(err.message || 'Failed to claim')
    } finally {
      setClaiming(null)
    }
  }

  const totalClaimed = claims.length
  const totalEarned = claims.reduce((sum, c) => {
    const ad = airdrops.find((a) => a.id === c.airdrop_id)
    return sum + (ad?.amount_usd_value || 0)
  }, 0)
  const availableCount = airdrops.filter((a) => !hasClaimed(a.id) && !isFull(a) && !isExpired(a)).length
  const refLink = user ? `coinova.app/ref/${user.id.slice(0, 8)}` : ''

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Airdrops</h1>
        <p className="text-[#8A8F98] text-sm mt-1">Claim free crypto — one time per coin per account</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#F6465D]/30 bg-[#F6465D]/10 px-4 py-3 text-[#F6465D] text-sm">
          {error}
          <button onClick={() => setError('')} className="float-right bg-transparent border-none text-[#F6465D] cursor-pointer">&times;</button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          [totalClaimed + ' claimed', 'Your airdrops'],
          [formatUSD(totalEarned), 'Total earned'],
          [availableCount + ' available', 'Unclaimed'],
        ].map(([val, label]) => (
          <div key={label} className="bg-[#141519] border border-[#1E2025] rounded-xl p-4 text-center">
            <div className="text-white text-lg font-bold">{val}</div>
            <div className="text-[#8A8F98] text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Airdrop grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-[#141519] border border-[#1E2025] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#1E2025]" />
                <div><div className="h-4 w-24 bg-[#1E2025] rounded mb-1" /><div className="h-3 w-12 bg-[#1E2025] rounded" /></div>
              </div>
              <div className="h-4 w-32 bg-[#1E2025] rounded mb-2" />
              <div className="h-10 w-full bg-[#1E2025] rounded" />
            </div>
          ))}
        </div>
      ) : airdrops.length === 0 ? (
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-10 text-center text-[#8A8F98] text-sm">
          No airdrops available right now. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {airdrops.map((a) => {
            const claimed = hasClaimed(a.id)
            const full = isFull(a)
            const expired = isExpired(a)
            const unavailable = full || expired
            const pct = a.max_claims > 0 ? Math.min((a.total_claimed / a.max_claims) * 100, 100) : 0

            return (
              <div
                key={a.id}
                className={`bg-[#141519] border rounded-xl p-5 transition-colors ${
                  claimed ? 'border-[#05B169]/40' : 'border-[#1E2025]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CoinLogo coinId={a.coin_id} image={a.coin_image} symbol={a.coin_symbol} />
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold">{a.coin_name}</div>
                    <div className="text-[#8A8F98] text-xs uppercase">{a.coin_symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">
                      {Number(a.amount).toLocaleString()} {a.coin_symbol}
                    </div>
                    <div className="text-[#8A8F98] text-xs">
                      &#8776; {formatUSD(a.amount_usd_value)}
                    </div>
                  </div>
                </div>

                {a.description && (
                  <div className="text-[#8A8F98] text-sm mb-3">{a.description}</div>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-[#8A8F98] mb-1">
                    <span>{a.total_claimed?.toLocaleString() || 0} claimed</span>
                    <span>{a.max_claims?.toLocaleString() || '~'} max</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1E2025]">
                    <div className="h-1.5 rounded-full bg-[#0052FF]" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="text-[#8A8F98] text-[11px] mb-3">
                  {a.expires_at ? `Expires ${new Date(a.expires_at).toLocaleDateString()}` : 'Never expires'}
                </div>

                {/* Status button */}
                {claimed ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#05B169]/10 text-[#05B169]">
                      Claimed &#10003;
                    </span>
                    <span className="text-[#8A8F98] text-xs">{claimDate(a.id)}</span>
                  </div>
                ) : unavailable ? (
                  <span className="inline-block px-3 py-2 rounded-lg text-sm font-semibold bg-[#1E2025] text-[#8A8F98]">
                    Unavailable
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaim(a)}
                    disabled={claiming === a.id}
                    className="w-full py-2.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {claiming === a.id ? 'Claiming...' : `Claim free ${a.coin_symbol}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Referral section */}
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div className="text-white font-semibold">Invite friends, earn crypto</div>
            <div className="text-[#8A8F98] text-sm">Share your referral link. When a friend joins and makes their first investment, you both get $5 in USDT.</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-2.5 text-sm text-white font-mono truncate">
            {refLink}
          </div>
          <CopyBtn text={refLink} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join Coinova and get free crypto! ${refLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] text-xs font-semibold no-underline hover:bg-[#25D366]/20 transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Coinova and claim free crypto airdrops! ${refLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-white/5 text-white text-xs font-semibold no-underline hover:bg-white/10 transition-colors"
          >
            X / Twitter
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join Coinova and get free crypto!')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[#0088CC]/10 text-[#0088CC] text-xs font-semibold no-underline hover:bg-[#0088CC]/20 transition-colors"
          >
            Telegram
          </a>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#8A8F98] mb-2">
          <span>0 referrals</span>
          <span>|</span>
          <span>$0.00 earned</span>
        </div>
        <div className="text-[#8A8F98] text-xs">Referral rewards coming soon — track your invites now!</div>
      </div>

      {/* Success modal */}
      {successAirdrop && (
        <SuccessModal airdrop={successAirdrop} onClose={() => setSuccessAirdrop(null)} />
      )}
    </div>
  )
}
