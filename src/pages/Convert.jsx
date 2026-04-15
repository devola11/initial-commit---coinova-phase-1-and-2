import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getTopMarkets, getLivePrices } from '../lib/coingecko'
import { formatUSD, formatCrypto } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'

const FEE_RATE = 0.001
const RATE_TTL = 30

/* ── Tiny reusable pieces ────────────────────────────────────────────── */

function CoinLogo({ id, image, symbol, size = 28 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-card-border flex items-center justify-center text-[9px] font-bold text-text-primary uppercase flex-shrink-0"
      >
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return (
    <img src={src} alt={symbol} onError={() => setErr(true)}
      style={{ width: size, height: size }}
      className="rounded-full bg-white/5 flex-shrink-0" />
  )
}

function DropdownArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* ── Coin selector modal ─────────────────────────────────────────────── */

function CoinSelector({ holdings, marketCoins, onSelect, onClose }) {
  const [q, setQ] = useState('')

  const ownedIds = new Set(holdings.map((h) => h.coin_id))

  const ownedRows = holdings
    .filter((h) => {
      if (!q) return true
      const s = q.toLowerCase()
      return (h.coin_name || '').toLowerCase().includes(s) ||
        (h.coin_symbol || '').toLowerCase().includes(s) ||
        (h.coin_id || '').toLowerCase().includes(s)
    })
    .map((h) => ({
      id: h.coin_id,
      symbol: h.coin_symbol || h.symbol,
      name: h.coin_name || h.name,
      image: h.image || null,
      balance: h.quantity,
    }))

  const marketRows = marketCoins
    .filter((c) => {
      if (ownedIds.has(c.id)) return false
      if (!q) return true
      const s = q.toLowerCase()
      return c.name.toLowerCase().includes(s) ||
        c.symbol.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s)
    })
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      balance: null,
    }))

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-[#1E2025]">
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search coin..."
            autoFocus
            className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5B616E] focus:outline-none focus:border-[#0052FF] transition-colors" />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {ownedRows.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-[#5B616E] font-semibold">Your holdings</div>
              {ownedRows.map((c) => (
                <button key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1d23] bg-transparent border-none cursor-pointer transition-colors text-left">
                  <CoinLogo id={c.id} image={c.image} symbol={c.symbol} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{c.name}</div>
                    <div className="text-[#8A919E] text-xs uppercase">{c.symbol}</div>
                  </div>
                  {c.balance != null && (
                    <div className="text-[#8A919E] text-xs">{formatCrypto(c.balance)}</div>
                  )}
                </button>
              ))}
            </>
          )}
          {marketRows.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-[#5B616E] font-semibold border-t border-[#1E2025]">All coins</div>
              {marketRows.map((c) => (
                <button key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1d23] bg-transparent border-none cursor-pointer transition-colors text-left">
                  <CoinLogo id={c.id} image={c.image} symbol={c.symbol} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{c.name}</div>
                    <div className="text-[#8A919E] text-xs uppercase">{c.symbol}</div>
                  </div>
                </button>
              ))}
            </>
          )}
          {ownedRows.length === 0 && marketRows.length === 0 && (
            <div className="py-10 text-center text-[#8A919E] text-sm">No coins found</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Success modal ───────────────────────────────────────────────────── */

function SuccessModal({ fromSymbol, fromAmt, toSymbol, toAmt, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141519] border border-[#1E2025] rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#05B169]/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-bold mb-3">Converted successfully!</h3>
        <div className="space-y-1 mb-6">
          <div className="text-[#8A919E] text-sm">
            Sold: <span className="text-white font-medium">{formatCrypto(fromAmt)} {fromSymbol.toUpperCase()}</span>
          </div>
          <div className="text-[#8A919E] text-sm">
            Received: <span className="text-[#05B169] font-medium">{formatCrypto(toAmt)} {toSymbol.toUpperCase()}</span>
          </div>
        </div>
        <Link to="/portfolio" onClick={onClose}
          className="inline-block w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold no-underline transition-colors text-center">
          View portfolio
        </Link>
      </div>
    </div>
  )
}

/* ── Main Convert page ───────────────────────────────────────────────── */

export default function Convert() {
  const { user } = useAuth()
  const { holdings, refreshAll } = usePortfolio()
  const [searchParams] = useSearchParams()

  // Coin state
  const [fromCoin, setFromCoin] = useState(null)
  const [toCoin, setToCoin] = useState(null)
  const [amount, setAmount] = useState('')
  const [selectorFor, setSelectorFor] = useState(null) // 'from' | 'to' | null

  // Market + price state
  const [marketCoins, setMarketCoins] = useState([])
  const [prices, setPrices] = useState({}) // { coinId: { usd, usd_24h_change } }
  const [rateLoading, setRateLoading] = useState(false)
  const [countdown, setCountdown] = useState(RATE_TTL)
  const countdownRef = useRef(null)

  // Transaction state
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  // Recent conversions
  const [recentTxs, setRecentTxs] = useState([])

  /* ── Load market coins once ─────────────────────────────────────────── */
  useEffect(() => {
    getTopMarkets(1, 50).then((data) => {
      if (Array.isArray(data)) setMarketCoins(data)
    }).catch(() => {})
  }, [])

  /* ── Pre-select FROM coin from query param ──────────────────────────── */
  useEffect(() => {
    const fromId = searchParams.get('from')
    if (!fromId || holdings.length === 0) return
    const h = holdings.find((x) => x.coin_id === fromId)
    if (h) {
      setFromCoin({
        id: h.coin_id,
        symbol: h.coin_symbol || h.symbol,
        name: h.coin_name || h.name,
        image: h.image || null,
      })
    }
  }, [searchParams, holdings])

  /* ── Default coins if none selected ─────────────────────────────────── */
  useEffect(() => {
    if (fromCoin || holdings.length === 0) return
    const first = holdings[0]
    setFromCoin({
      id: first.coin_id,
      symbol: first.coin_symbol || first.symbol,
      name: first.coin_name || first.name,
      image: first.image || null,
    })
  }, [holdings, fromCoin])

  useEffect(() => {
    if (toCoin || marketCoins.length === 0) return
    // default TO = ethereum (or first non-from coin)
    const eth = marketCoins.find((c) => c.id === 'ethereum')
    const fallback = marketCoins.find((c) => c.id !== fromCoin?.id)
    const pick = eth || fallback
    if (pick) setToCoin({ id: pick.id, symbol: pick.symbol, name: pick.name, image: pick.image })
  }, [marketCoins, toCoin, fromCoin])

  /* ── Fetch live prices for both coins ───────────────────────────────── */
  const fetchRates = useCallback(async () => {
    const ids = [fromCoin?.id, toCoin?.id].filter(Boolean)
    if (ids.length === 0) return
    setRateLoading(true)
    try {
      const data = await getLivePrices(ids)
      setPrices((prev) => ({ ...prev, ...data }))
    } catch { /* ignored */ }
    setRateLoading(false)
    setCountdown(RATE_TTL)
  }, [fromCoin?.id, toCoin?.id])

  useEffect(() => { fetchRates() }, [fetchRates])

  // Countdown timer
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchRates()
          return RATE_TTL
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [fetchRates])

  /* ── Fetch recent conversions ───────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!data) return
        // Group sell+buy pairs by timestamp proximity
        const sells = data.filter((t) => t.type === 'sell' && t.notes?.startsWith('convert:'))
        const buys = data.filter((t) => t.type === 'buy' && t.notes?.startsWith('convert:'))
        const pairs = []
        for (const s of sells) {
          const tag = s.notes // "convert:<timestamp>"
          const b = buys.find((x) => x.notes === tag)
          if (b) {
            pairs.push({
              id: s.id,
              fromSymbol: s.coin_symbol || s.coin_id,
              fromAmt: s.quantity,
              toSymbol: b.coin_symbol || b.coin_id,
              toAmt: b.quantity,
              date: s.created_at,
            })
          }
        }
        setRecentTxs(pairs.slice(0, 5))
      })
  }, [user, success])

  /* ── Derived values ─────────────────────────────────────────────────── */
  const fromPrice = prices[fromCoin?.id]?.usd || 0
  const toPrice = prices[toCoin?.id]?.usd || 0
  const fromHolding = holdings.find((h) => h.coin_id === fromCoin?.id)
  const fromBalance = fromHolding?.quantity || 0

  const numAmt = parseFloat(amount) || 0
  const fee = numAmt * FEE_RATE
  const afterFee = numAmt - fee
  const toAmount = toPrice > 0 ? afterFee * (fromPrice / toPrice) : 0

  const rate = toPrice > 0 ? fromPrice / toPrice : 0
  const reverseRate = fromPrice > 0 ? toPrice / fromPrice : 0

  const canConvert = numAmt > 0 && numAmt <= fromBalance && fromCoin && toCoin && fromCoin.id !== toCoin.id && toPrice > 0

  /* ── Quick amount buttons ───────────────────────────────────────────── */
  function setQuickAmt(pct) {
    const val = fromBalance * pct
    setAmount(val > 0 ? formatCrypto(val) : '')
  }

  /* ── Swap from/to ───────────────────────────────────────────────────── */
  function handleSwap() {
    const tmpFrom = fromCoin
    const tmpTo = toCoin
    setFromCoin(tmpTo)
    setToCoin(tmpFrom)
    setAmount('')
  }

  /* ── Selector callbacks ─────────────────────────────────────────────── */
  function handleSelectCoin(coin) {
    const normalized = { id: coin.id, symbol: coin.symbol, name: coin.name, image: coin.image }
    if (selectorFor === 'from') {
      if (toCoin?.id === coin.id) setToCoin(fromCoin)
      setFromCoin(normalized)
    } else {
      if (fromCoin?.id === coin.id) setFromCoin(toCoin)
      setToCoin(normalized)
    }
    setSelectorFor(null)
    setAmount('')
  }

  /* ── Execute conversion ─────────────────────────────────────────────── */
  async function handleConvert() {
    if (!canConvert || converting) return
    setConverting(true)
    setError('')

    try {
      const tag = `convert:${Date.now()}`

      // 1. Reduce FROM holding
      const newFromQty = fromBalance - numAmt
      if (newFromQty <= 0.000000001) {
        await supabase.from('holdings').delete().eq('id', fromHolding.id)
      } else {
        await supabase.from('holdings').update({ quantity: newFromQty }).eq('id', fromHolding.id)
      }

      // 2. Increase TO holding
      const toHolding = holdings.find((h) => h.coin_id === toCoin.id)
      if (toHolding) {
        // weighted average buy price
        const oldCost = toHolding.quantity * toHolding.buy_price_usd
        const newCost = toAmount * toPrice
        const totalQty = toHolding.quantity + toAmount
        const avgPrice = totalQty > 0 ? (oldCost + newCost) / totalQty : toPrice
        await supabase.from('holdings').update({
          quantity: totalQty,
          buy_price_usd: avgPrice,
        }).eq('id', toHolding.id)
      } else {
        await supabase.from('holdings').insert({
          user_id: user.id,
          coin_id: toCoin.id,
          coin_symbol: toCoin.symbol.toUpperCase(),
          coin_name: toCoin.name,
          coin_image: toCoin.image || null,
          quantity: toAmount,
          buy_price_usd: toPrice,
        })
      }

      // 3. Insert transaction records
      await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type: 'sell',
          coin_id: fromCoin.id,
          coin_symbol: fromCoin.symbol.toUpperCase(),
          quantity: numAmt,
          price_usd: fromPrice,
          total_usd: numAmt * fromPrice,
          notes: tag,
        },
        {
          user_id: user.id,
          type: 'buy',
          coin_id: toCoin.id,
          coin_symbol: toCoin.symbol.toUpperCase(),
          quantity: toAmount,
          price_usd: toPrice,
          total_usd: toAmount * toPrice,
          notes: tag,
        },
      ])

      await refreshAll()
      setSuccess({
        fromSymbol: fromCoin.symbol,
        fromAmt: numAmt,
        toSymbol: toCoin.symbol,
        toAmt: toAmount,
      })
      setAmount('')
    } catch (err) {
      console.error('Conversion failed:', err)
      setError('Conversion failed. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Convert</h1>
        <p className="text-text-muted text-sm mt-1">Swap one crypto for another instantly</p>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Convert card */}
        <div className="bg-[#141519] border border-[#1E2025] rounded-2xl p-5">

          {/* FROM section */}
          <div className="mb-1">
            <div className="text-[#8A919E] text-xs font-semibold uppercase tracking-wider mb-2">You pay</div>
            <div className="bg-[#0A0B0D] rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  onClick={() => setSelectorFor('from')}
                  className="flex items-center gap-2 bg-[#1E2025] hover:bg-[#2C2F36] rounded-lg px-3 py-2 border-none cursor-pointer transition-colors flex-shrink-0"
                >
                  {fromCoin ? (
                    <>
                      <CoinLogo id={fromCoin.id} image={fromCoin.image} symbol={fromCoin.symbol} size={24} />
                      <span className="text-white text-sm font-semibold uppercase">{fromCoin.symbol}</span>
                    </>
                  ) : (
                    <span className="text-[#8A919E] text-sm">Select</span>
                  )}
                  <DropdownArrow />
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    if (v.split('.').length <= 2) setAmount(v)
                  }}
                  placeholder="0"
                  className="bg-transparent border-none outline-none text-white text-right font-bold w-full min-w-0"
                  style={{ fontSize: '28px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[#8A919E] text-xs">
                  Balance: {formatCrypto(fromBalance)} {fromCoin?.symbol?.toUpperCase() || ''}
                </div>
                <div className="flex items-center gap-1.5">
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <button key={pct}
                      onClick={() => setQuickAmt(pct)}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-[#1E2025] hover:bg-[#2C2F36] text-[#8A919E] hover:text-white border-none cursor-pointer transition-colors">
                      {pct === 1 ? 'Max' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
              {numAmt > fromBalance && fromBalance > 0 && (
                <div className="text-[#F6465D] text-xs mt-2">Exceeds your balance</div>
              )}
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-[#141519] border-2 border-[#0052FF] flex items-center justify-center cursor-pointer hover:bg-[#0052FF]/10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* TO section */}
          <div className="mt-1">
            <div className="text-[#8A919E] text-xs font-semibold uppercase tracking-wider mb-2">You receive</div>
            <div className="bg-[#0A0B0D] rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  onClick={() => setSelectorFor('to')}
                  className="flex items-center gap-2 bg-[#1E2025] hover:bg-[#2C2F36] rounded-lg px-3 py-2 border-none cursor-pointer transition-colors flex-shrink-0"
                >
                  {toCoin ? (
                    <>
                      <CoinLogo id={toCoin.id} image={toCoin.image} symbol={toCoin.symbol} size={24} />
                      <span className="text-white text-sm font-semibold uppercase">{toCoin.symbol}</span>
                    </>
                  ) : (
                    <span className="text-[#8A919E] text-sm">Select</span>
                  )}
                  <DropdownArrow />
                </button>
                <div className="text-white text-right font-bold min-w-0 truncate" style={{ fontSize: '28px' }}>
                  {numAmt > 0 ? formatCrypto(toAmount) : '0'}
                </div>
              </div>
              <div className="text-[#8A919E] text-xs">
                {toPrice > 0 ? `1 ${toCoin?.symbol?.toUpperCase() || ''} = ${formatUSD(toPrice)}` : '-'}
              </div>
            </div>
          </div>

          {/* Rate info */}
          {fromCoin && toCoin && rate > 0 && (
            <div className="mt-4 px-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#8A919E] text-xs">Rate</span>
                <span className="text-[#8A919E] text-xs">
                  1 {fromCoin.symbol.toUpperCase()} = {formatCrypto(rate)} {toCoin.symbol.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A919E] text-xs">Inverse</span>
                <span className="text-[#8A919E] text-xs">
                  1 {toCoin.symbol.toUpperCase()} = {formatCrypto(reverseRate)} {fromCoin.symbol.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A919E] text-xs">Fee</span>
                <span className="text-[#8A919E] text-xs">0.1% conversion fee</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A919E] text-xs">Rate expires in</span>
                <span className={`text-xs font-medium flex items-center gap-1 ${countdown <= 10 ? 'text-[#F59E0B]' : 'text-[#8A919E]'}`}>
                  {rateLoading ? (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  ) : null}
                  {countdown}s
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 text-[#F6465D] text-xs text-center">{error}</div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConvert}
            disabled={!canConvert || converting}
            className={`w-full mt-5 py-3.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors ${
              canConvert && !converting
                ? 'bg-[#0052FF] hover:bg-[#0046D9] text-white'
                : 'bg-[#1E2025] text-[#5B616E] cursor-not-allowed'
            }`}
          >
            {converting
              ? 'Converting...'
              : fromCoin && toCoin
                ? `Convert ${fromCoin.symbol.toUpperCase()} to ${toCoin.symbol.toUpperCase()}`
                : 'Select coins to convert'}
          </button>
        </div>

        {/* Recent conversions */}
        {recentTxs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-text-primary font-semibold text-sm mb-3">Recent conversions</h3>
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl overflow-hidden divide-y divide-[#1E2025]">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">{formatCrypto(tx.fromAmt)}</span>
                    <span className="text-[#8A919E] uppercase text-xs">{tx.fromSymbol}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A919E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    <span className="text-[#05B169] font-medium">{formatCrypto(tx.toAmt)}</span>
                    <span className="text-[#8A919E] uppercase text-xs">{tx.toSymbol}</span>
                  </div>
                  <div className="text-[#5B616E] text-xs">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coin selector modal */}
      {selectorFor && (
        <CoinSelector
          holdings={holdings}
          marketCoins={marketCoins}
          onSelect={handleSelectCoin}
          onClose={() => setSelectorFor(null)}
        />
      )}

      {/* Success modal */}
      {success && (
        <SuccessModal
          fromSymbol={success.fromSymbol}
          fromAmt={success.fromAmt}
          toSymbol={success.toSymbol}
          toAmt={success.toAmt}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  )
}
