import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getLivePrices } from '../lib/coingecko'
import { formatUSD, formatCrypto } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'

/* ── Staking plans ────────────────────────────────────────────────────── */

export const STAKING_PLANS = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',    apy: 2,  minStake: 0.0001, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',   apy: 4,  minStake: 0.001,  image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',     apy: 6,  minStake: 0.1,    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',        apy: 5,  minStake: 0.01,   image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'shiba-inu',   symbol: 'SHIB', name: 'Shiba Inu',  apy: 12, minStake: 100000, image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',   apy: 8,  minStake: 10,     image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
]

export const STAKING_APY_MAP = Object.fromEntries(STAKING_PLANS.map((p) => [p.id, p.apy]))

const DURATIONS = [30, 60, 90]
const EARLY_PENALTY = 0.01

/* ── Helpers ──────────────────────────────────────────────────────────── */

function calcRewards(amount, apy, daysElapsed) {
  return (amount * (apy / 100) / 365) * daysElapsed
}

function daysElapsed(stakedAt) {
  return Math.max(0, (Date.now() - new Date(stakedAt).getTime()) / 86400000)
}

function daysRemaining(unlocksAt) {
  return Math.max(0, (new Date(unlocksAt).getTime() - Date.now()) / 86400000)
}

function progressPct(stakedAt, unlocksAt) {
  const total = new Date(unlocksAt).getTime() - new Date(stakedAt).getTime()
  const elapsed = Date.now() - new Date(stakedAt).getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CoinLogo({ id, image, symbol, size = 32 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0">
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)}
    style={{ width: size, height: size }} className="rounded-full bg-white/5 flex-shrink-0" />
}

/* ── Stake Modal ──────────────────────────────────────────────────────── */

function StakeModal({ plan, balance, onConfirm, onClose }) {
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState(30)
  const [submitting, setSubmitting] = useState(false)

  const numAmt = parseFloat(amount) || 0
  const estRewards = calcRewards(numAmt, plan.apy, duration)
  const unlockDate = new Date(Date.now() + duration * 86400000)
  const canStake = numAmt >= plan.minStake && numAmt <= balance && !submitting

  async function handleConfirm() {
    if (!canStake) return
    setSubmitting(true)
    await onConfirm(plan, numAmt, duration)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#141519] border border-[#1E2025] rounded-2xl p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <CoinLogo id={plan.id} image={plan.image} symbol={plan.symbol} size={40} />
          <div>
            <div className="text-white font-semibold">{plan.name}</div>
            <div className="text-[#05B169] text-sm font-semibold">{plan.apy}% APY</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2 block">Amount to stake</label>
          <div className="flex items-center gap-2 bg-[#0A0B0D] rounded-xl px-4 py-3">
            <input type="text" inputMode="decimal" value={amount}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); if (v.split('.').length <= 2) setAmount(v) }}
              placeholder="0" className="bg-transparent border-none outline-none text-white text-xl font-bold flex-1 min-w-0" />
            <button onClick={() => setAmount(String(balance))}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-[#1E2025] hover:bg-[#2C2F36] text-[#8A919E] hover:text-white border-none cursor-pointer transition-colors">Max</button>
          </div>
          <div className="text-[#8A919E] text-xs mt-1.5">Available: {formatCrypto(balance)} {plan.symbol}</div>
          {numAmt > 0 && numAmt < plan.minStake && (
            <div className="text-[#F6465D] text-xs mt-1">Min stake: {formatCrypto(plan.minStake)} {plan.symbol}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2 block">Duration</label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button key={d} onClick={() => setDuration(d)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors ${
                  duration === d ? 'bg-[#0052FF] text-white' : 'bg-[#1E2025] text-[#8A919E] hover:text-white'
                }`}>{d} days</button>
            ))}
          </div>
        </div>

        {numAmt > 0 && (
          <div className="bg-[#0A0B0D] rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8A919E]">You will earn</span>
              <span className="text-[#05B169] font-semibold">{formatCrypto(estRewards)} {plan.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8A919E]">Unlock date</span>
              <span className="text-white font-medium">{fmtDate(unlockDate)}</span>
            </div>
          </div>
        )}

        <div className="bg-[#F59E0B]/10 rounded-lg px-3 py-2 mb-5">
          <div className="text-[#F59E0B] text-xs flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Staked coins are locked until the unlock date
          </div>
        </div>

        <button onClick={handleConfirm} disabled={!canStake}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors ${
            canStake ? 'bg-[#0052FF] hover:bg-[#0046D9] text-white' : 'bg-[#1E2025] text-[#5B616E] cursor-not-allowed'
          }`}>
          {submitting ? 'Staking...' : 'Confirm stake'}
        </button>
      </div>
    </div>
  )
}

/* ── Success Modal ────────────────────────────────────────────────────── */

function SuccessModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141519] border border-[#1E2025] rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#05B169]/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h3 className="text-white text-lg font-bold mb-1">{data.title}</h3>
        <p className="text-[#8A919E] text-sm mb-1">{data.line1}</p>
        {data.line2 && <p className="text-[#8A919E] text-sm mb-1">{data.line2}</p>}
        {data.line3 && <p className="text-[#8A919E] text-sm">{data.line3}</p>}
        <button onClick={onClose}
          className="mt-5 w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
          View staking positions
        </button>
      </div>
    </div>
  )
}

/* ── Early Unstake Warning ────────────────────────────────────────────── */

function EarlyUnstakeModal({ position, onConfirm, onClose }) {
  const penalty = position.amount_staked * EARLY_PENALTY
  const returnAmt = position.amount_staked - penalty
  const [submitting, setSubmitting] = useState(false)

  async function handle() {
    setSubmitting(true)
    await onConfirm(position, returnAmt)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141519] border border-[#1E2025] rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#F6465D]/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F6465D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 className="text-white text-lg font-bold text-center mb-3">Early unstake penalty</h3>
        <div className="bg-[#0A0B0D] rounded-xl p-4 space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-[#8A919E]">Penalty (1%)</span>
            <span className="text-[#F6465D] font-medium">-{formatCrypto(penalty)} {position.coin_symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8A919E]">You will receive</span>
            <span className="text-white font-semibold">{formatCrypto(returnAmt)} {position.coin_symbol}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-[#1E2025] text-white text-sm font-semibold border-none cursor-pointer hover:bg-[#2C2F36] transition-colors">Cancel</button>
          <button onClick={handle} disabled={submitting}
            className="flex-1 py-3 rounded-lg bg-[#F6465D] hover:bg-[#d93a4d] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
            {submitting ? 'Unstaking...' : 'Unstake now'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Plan Card ────────────────────────────────────────────────────────── */

function PlanCard({ plan, balance, onStake }) {
  const [dur, setDur] = useState(30)
  const [previewAmt] = useState(plan.minStake)
  const estRewards = calcRewards(previewAmt, plan.apy, dur)
  const hasBalance = balance >= plan.minStake

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5 hover:border-[#2C2F36] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CoinLogo id={plan.id} image={plan.image} symbol={plan.symbol} size={36} />
          <div>
            <div className="text-white font-semibold">{plan.name}</div>
            <div className="text-[#8A919E] text-xs uppercase">{plan.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#05B169] text-xl font-bold">{plan.apy}%</div>
          <div className="text-[#8A919E] text-[10px] uppercase tracking-wider">APY</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-semibold">Locked</span>
        <span className="text-[#5B616E] text-[10px]">Min: {formatCrypto(plan.minStake)} {plan.symbol}</span>
      </div>

      <div className="flex gap-1.5 mb-3">
        {DURATIONS.map((d) => (
          <button key={d} onClick={() => setDur(d)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
              dur === d ? 'bg-[#0052FF] text-white' : 'bg-[#0A0B0D] text-[#8A919E] hover:text-white'
            }`}>{d}d</button>
        ))}
      </div>

      <div className="bg-[#0A0B0D] rounded-lg p-3 mb-4 text-xs text-[#8A919E]">
        Stake {formatCrypto(previewAmt)} {plan.symbol} for {dur} days = <span className="text-[#05B169] font-semibold">{formatCrypto(estRewards)} {plan.symbol}</span>
      </div>

      {hasBalance ? (
        <>
          <div className="text-[#8A919E] text-xs mb-2">Balance: {formatCrypto(balance)} {plan.symbol}</div>
          <button onClick={() => onStake(plan)}
            className="w-full py-2.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
            Stake now
          </button>
        </>
      ) : (
        <>
          <div className="text-[#8A919E] text-xs mb-2">No {plan.symbol} balance</div>
          <Link to="/invest"
            className="block w-full py-2.5 rounded-lg bg-[#1E2025] text-[#8A919E] text-sm font-semibold text-center no-underline hover:bg-[#2C2F36] transition-colors">
            Buy {plan.symbol} first
          </Link>
        </>
      )}
    </div>
  )
}

/* ── Active Positions Table ───────────────────────────────────────────── */

function PositionsTable({ positions, prices, onClaim, onEarlyUnstake }) {
  if (positions.length === 0) {
    return (
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl py-12 px-6 text-center">
        <div className="text-[#8A919E] text-sm">No active staking positions</div>
        <div className="text-[#5B616E] text-xs mt-1">Stake your coins above to start earning rewards</div>
      </div>
    )
  }

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E2025] text-left text-xs uppercase tracking-widest text-[#8A919E]">
              <th className="py-3 px-4 font-medium">Coin</th>
              <th className="py-3 px-4 font-medium">Staked</th>
              <th className="py-3 px-4 font-medium hidden sm:table-cell">APY</th>
              <th className="py-3 px-4 font-medium hidden md:table-cell">Rewards</th>
              <th className="py-3 px-4 font-medium hidden lg:table-cell">Progress</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const elapsed = daysElapsed(pos.staked_at)
              const liveRewards = calcRewards(pos.amount_staked, pos.apy, Math.min(elapsed, pos.duration_days))
              const remaining = daysRemaining(pos.unlocks_at)
              const pct = progressPct(pos.staked_at, pos.unlocks_at)
              const isUnlocked = remaining <= 0
              const price = prices[pos.coin_id]?.usd || 0
              const rewardsUsd = liveRewards * price

              return (
                <tr key={pos.id} className="border-b border-[#1E2025] last:border-b-0 hover:bg-[#0A0B0D]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <CoinLogo id={pos.coin_id} image={pos.coin_image} symbol={pos.coin_symbol} size={28} />
                      <div>
                        <div className="text-white font-medium text-sm">{pos.coin_name}</div>
                        <div className="text-[#8A919E] text-xs uppercase">{pos.coin_symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white text-sm font-medium">{formatCrypto(pos.amount_staked)} {pos.coin_symbol}</div>
                    <div className="text-[#8A919E] text-xs">{formatUSD(pos.amount_staked * price)}</div>
                  </td>
                  <td className="py-4 px-4 text-[#05B169] font-semibold hidden sm:table-cell">{pos.apy}%</td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    <div className="text-[#05B169] font-medium text-sm">{formatCrypto(liveRewards)} {pos.coin_symbol}</div>
                    <div className="text-[#8A919E] text-xs">{formatUSD(rewardsUsd)}</div>
                  </td>
                  <td className="py-4 px-4 hidden lg:table-cell">
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] text-[#8A919E] mb-1">
                        <span>{Math.round(pct)}%</span>
                        <span>{Math.ceil(remaining)}d left</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#1E2025]">
                        <div className="h-1.5 rounded-full bg-[#0052FF] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#05B169]/15 text-[#05B169] text-[10px] font-semibold">Unlocked</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-semibold">Locked</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {isUnlocked ? (
                      <button onClick={() => onClaim(pos, liveRewards)}
                        className="px-3 py-1.5 rounded-lg bg-[#05B169] hover:bg-[#04a05e] text-white text-xs font-semibold border-none cursor-pointer transition-colors">
                        Claim rewards
                      </button>
                    ) : (
                      <button onClick={() => onEarlyUnstake(pos)}
                        className="px-3 py-1.5 rounded-lg bg-transparent border border-[#1E2025] hover:border-[#F6465D] text-[#8A919E] hover:text-[#F6465D] text-xs font-semibold cursor-pointer transition-colors">
                        Claim early
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Main Staking Page ────────────────────────────────────────────────── */

export default function Staking() {
  const { user } = useAuth()
  const { holdings, refreshAll } = usePortfolio()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState({})
  const [stakeModal, setStakeModal] = useState(null)
  const [earlyModal, setEarlyModal] = useState(null)
  const [success, setSuccess] = useState(null)

  // Load positions
  const loadPositions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('staking_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('staked_at', { ascending: false })
    setPositions(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { loadPositions() }, [loadPositions])

  // Load prices for staking coins
  useEffect(() => {
    const ids = STAKING_PLANS.map((p) => p.id)
    getLivePrices(ids).then((data) => setPrices(data || {})).catch(() => {})
  }, [])

  // Get user balance for a coin
  function getBalance(coinId) {
    const h = holdings.find((x) => x.coin_id === coinId)
    return h?.quantity || 0
  }

  // Stats
  const stats = useMemo(() => {
    let totalStakedUsd = 0
    let totalRewardsUsd = 0
    let totalApy = 0
    positions.forEach((p) => {
      const price = prices[p.coin_id]?.usd || 0
      const elapsed = daysElapsed(p.staked_at)
      const rewards = calcRewards(p.amount_staked, p.apy, Math.min(elapsed, p.duration_days))
      totalStakedUsd += p.amount_staked * price
      totalRewardsUsd += rewards * price
      totalApy += p.apy
    })
    return {
      totalStakedUsd,
      totalRewardsUsd,
      activeCount: positions.length,
      avgApy: positions.length > 0 ? totalApy / positions.length : 0,
    }
  }, [positions, prices])

  // Stake confirm
  async function handleStakeConfirm(plan, amount, duration) {
    const holding = holdings.find((h) => h.coin_id === plan.id)
    if (!holding || holding.quantity < amount) return

    const newQty = holding.quantity - amount
    if (newQty <= 0.000000001) {
      await supabase.from('holdings').delete().eq('id', holding.id)
    } else {
      await supabase.from('holdings').update({ quantity: newQty }).eq('id', holding.id)
    }

    const unlocksAt = new Date(Date.now() + duration * 86400000).toISOString()
    await supabase.from('staking_positions').insert({
      user_id: user.id,
      coin_id: plan.id,
      coin_symbol: plan.symbol,
      coin_name: plan.name,
      coin_image: plan.image,
      amount_staked: amount,
      apy: plan.apy,
      duration_days: duration,
      unlocks_at: unlocksAt,
    })

    await Promise.all([refreshAll(), loadPositions()])
    setStakeModal(null)
    setSuccess({
      title: 'Staking confirmed!',
      line1: `${formatCrypto(amount)} ${plan.symbol} is now staking`,
      line2: `Earning ${plan.apy}% APY`,
      line3: `Unlocks on ${fmtDate(unlocksAt)}`,
    })
  }

  // Claim rewards (unlocked)
  async function handleClaim(pos, liveRewards) {
    const totalReturn = pos.amount_staked + liveRewards
    const existingHolding = holdings.find((h) => h.coin_id === pos.coin_id)
    const price = prices[pos.coin_id]?.usd || 0

    if (existingHolding) {
      const oldCost = existingHolding.quantity * existingHolding.buy_price_usd
      const newCost = totalReturn * price
      const totalQty = existingHolding.quantity + totalReturn
      const avgPrice = totalQty > 0 ? (oldCost + newCost) / totalQty : price
      await supabase.from('holdings').update({ quantity: totalQty, buy_price_usd: avgPrice }).eq('id', existingHolding.id)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id, coin_id: pos.coin_id, coin_symbol: pos.coin_symbol,
        coin_name: pos.coin_name, coin_image: pos.coin_image, quantity: totalReturn, buy_price_usd: price,
      })
    }

    await supabase.from('staking_positions').update({
      status: 'completed', rewards_earned: liveRewards, last_reward_at: new Date().toISOString(),
    }).eq('id', pos.id)

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'buy', coin_id: pos.coin_id, coin_symbol: pos.coin_symbol,
      quantity: liveRewards, price_usd: price, total_usd: liveRewards * price, notes: 'staking_reward',
    })

    await Promise.all([refreshAll(), loadPositions()])
    setSuccess({
      title: 'Rewards claimed!',
      line1: `${formatCrypto(pos.amount_staked)} ${pos.coin_symbol} returned`,
      line2: `${formatCrypto(liveRewards)} ${pos.coin_symbol} rewards added`,
    })
  }

  // Early unstake
  async function handleEarlyUnstake(pos, returnAmt) {
    const existingHolding = holdings.find((h) => h.coin_id === pos.coin_id)
    const price = prices[pos.coin_id]?.usd || 0

    if (existingHolding) {
      await supabase.from('holdings').update({ quantity: existingHolding.quantity + returnAmt }).eq('id', existingHolding.id)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id, coin_id: pos.coin_id, coin_symbol: pos.coin_symbol,
        coin_name: pos.coin_name, coin_image: pos.coin_image, quantity: returnAmt, buy_price_usd: price,
      })
    }

    await supabase.from('staking_positions').update({ status: 'cancelled' }).eq('id', pos.id)
    await Promise.all([refreshAll(), loadPositions()])
    setEarlyModal(null)
    setSuccess({
      title: 'Unstaked early',
      line1: `${formatCrypto(returnAmt)} ${pos.coin_symbol} returned (1% penalty applied)`,
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Staking</h1>
        <p className="text-text-muted text-sm mt-1">Earn passive rewards on your crypto</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Total Staked', value: formatUSD(stats.totalStakedUsd) },
          { label: 'Rewards Earned', value: formatUSD(stats.totalRewardsUsd), green: true },
          { label: 'Active Positions', value: String(stats.activeCount) },
          { label: 'Average APY', value: `${stats.avgApy.toFixed(1)}%`, green: true },
        ].map((s) => (
          <div key={s.label} className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
            <div className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.green ? 'text-[#05B169]' : 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Available plans */}
      <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Available Staking Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {STAKING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} balance={getBalance(plan.id)} onStake={setStakeModal} />
        ))}
      </div>

      {/* Active positions */}
      <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Active Positions</h2>
      {loading ? (
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-8 text-center text-[#8A919E] text-sm animate-pulse">
          Loading positions...
        </div>
      ) : (
        <PositionsTable positions={positions} prices={prices} onClaim={handleClaim} onEarlyUnstake={setEarlyModal} />
      )}

      {/* Modals */}
      {stakeModal && (
        <StakeModal plan={stakeModal} balance={getBalance(stakeModal.id)} onConfirm={handleStakeConfirm} onClose={() => setStakeModal(null)} />
      )}
      {earlyModal && (
        <EarlyUnstakeModal position={earlyModal} onConfirm={handleEarlyUnstake} onClose={() => setEarlyModal(null)} />
      )}
      {success && <SuccessModal data={success} onClose={() => setSuccess(null)} />}
    </div>
  )
}

/* ── Dashboard Widget (exported) ──────────────────────────────────────── */

export function StakingWidget() {
  const { user } = useAuth()
  const [positions, setPositions] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('staking_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('staked_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setPositions(data || []); setLoading(false) })
  }, [user])

  useEffect(() => {
    const ids = STAKING_PLANS.map((p) => p.id)
    getLivePrices(ids).then((data) => setPrices(data || {})).catch(() => {})
  }, [])

  if (loading) return null

  const totalRewardsToday = positions.reduce((sum, p) => {
    const price = prices[p.coin_id]?.usd || 0
    const dailyReward = (p.amount_staked * (p.apy / 100)) / 365
    return sum + dailyReward * price
  }, 0)

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">Staking Rewards</h3>
        <Link to="/staking" className="text-primary-blue text-xs font-semibold no-underline hover:underline">View all</Link>
      </div>
      {positions.length === 0 ? (
        <div>
          <p className="text-text-muted text-sm mb-3">Start earning passive rewards on your crypto.</p>
          <Link to="/staking" className="inline-block px-4 py-2 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-semibold no-underline transition-colors">
            Explore staking
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="text-[#8A919E] text-xs mb-0.5">Earning today</div>
            <div className="text-[#05B169] text-lg font-bold">{formatUSD(totalRewardsToday)}/day</div>
          </div>
          <div className="space-y-2.5">
            {positions.map((p) => {
              const elapsed = daysElapsed(p.staked_at)
              const rewards = calcRewards(p.amount_staked, p.apy, Math.min(elapsed, p.duration_days))
              const remaining = daysRemaining(p.unlocks_at)
              return (
                <div key={p.id} className="flex items-center gap-2.5">
                  <CoinLogo id={p.coin_id} image={p.coin_image} symbol={p.coin_symbol} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium">{formatCrypto(p.amount_staked)} {p.coin_symbol}</div>
                    <div className="text-[#8A919E] text-[10px]">{p.apy}% APY · {Math.ceil(remaining)}d left</div>
                  </div>
                  <div className="text-[#05B169] text-xs font-medium">+{formatCrypto(rewards)}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
