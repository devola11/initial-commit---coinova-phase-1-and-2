import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHoldings } from '../hooks/useHoldings'
import { usePortfolio } from '../context/PortfolioContext'
import { formatUSD, formatCrypto, formatPercent } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis,
} from 'recharts'

/* ── Constants ────────────────────────────────────────────────────────── */

const HIGH_RISK = new Set([
  'shiba-inu', 'dogecoin', 'pepe', 'floki', 'bonk', 'memecoin',
  'dogwifhat', 'brett', 'turbo', 'mog-coin', 'baby-doge-coin',
])
const LOW_RISK = new Set(['bitcoin', 'ethereum', 'tether', 'usd-coin'])

const PIE_COLORS = [
  '#0052FF', '#F59E0B', '#05B169', '#F6465D', '#8B5CF6',
  '#EC4899', '#06B6D4', '#22C55E', '#FF8C00', '#8A919E',
]

function riskLevel(coinId) {
  if (LOW_RISK.has(coinId)) return 'Low'
  if (HIGH_RISK.has(coinId)) return 'High'
  return 'Medium'
}

function riskColor(level) {
  if (level === 'Low') return { text: '#05B169', bg: 'rgba(5,177,105,0.12)' }
  if (level === 'High') return { text: '#F6465D', bg: 'rgba(246,70,93,0.12)' }
  return { text: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
}

/* ── Small components ─────────────────────────────────────────────────── */

function CoinLogo({ id, image, symbol, size = 28 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-[8px] font-bold text-white uppercase flex-shrink-0">
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)}
    style={{ width: size, height: size }} className="rounded-full bg-white/5 flex-shrink-0" />
}

function RiskBadge({ level }) {
  const c = riskColor(level)
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: c.text, backgroundColor: c.bg }}>
      {level}
    </span>
  )
}

/* ── Score Gauge (SVG circle) ─────────────────────────────────────────── */

function ScoreGauge({ value, size = 140 }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (v / 100) * circ
  let color = '#F6465D'
  if (v > 80) color = '#05B169'
  else if (v > 60) color = '#0052FF'
  else if (v > 40) color = '#F59E0B'

  const grade = v >= 90 ? 'A+' : v >= 80 ? 'A' : v >= 70 ? 'B' : v >= 60 ? 'C' : v >= 40 ? 'D' : 'F'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E2025" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{v}</span>
        <span className="text-sm font-semibold" style={{ color }}>{grade}</span>
      </div>
    </div>
  )
}

/* ── Mini Gauge for Dashboard Widget ──────────────────────────────────── */

function MiniGauge({ value, size = 60 }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (v / 100) * circ
  let color = '#F6465D'
  if (v > 80) color = '#05B169'
  else if (v > 60) color = '#0052FF'
  else if (v > 40) color = '#F59E0B'
  const grade = v >= 90 ? 'A+' : v >= 80 ? 'A' : v >= 70 ? 'B' : v >= 60 ? 'C' : v >= 40 ? 'D' : 'F'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E2025" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{grade}</span>
      </div>
    </div>
  )
}

/* ── Sparkline ────────────────────────────────────────────────────────── */

function Sparkline({ positive }) {
  const pts = useMemo(() => {
    const base = positive ? 40 : 60
    const trend = positive ? 0.8 : -0.8
    return Array.from({ length: 7 }, (_, i) => ({
      x: i, y: base + trend * i * 5 + (Math.random() - 0.5) * 10,
    }))
  }, [positive])

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts}>
          <Line type="monotone" dataKey="y" stroke={positive ? '#05B169' : '#F6465D'}
            strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Insight Card ─────────────────────────────────────────────────────── */

function InsightCard({ icon, title, text, actionLabel, actionTo, borderColor }) {
  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4 flex gap-3"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}>
      <div className="text-lg flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold mb-1">{title}</div>
        <div className="text-[#8A919E] text-xs leading-relaxed">{text}</div>
        {actionLabel && actionTo && (
          <Link to={actionTo}
            className="inline-block mt-2 text-[#0052FF] text-xs font-semibold no-underline hover:underline">
            {actionLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}

/* ── Calculations ─────────────────────────────────────────────────────── */

function calcAnalytics(holdings, totalValue, totalPnl, totalCost, transactions) {
  if (!holdings.length) {
    return {
      score: 0, diversification: 0, performance: 0, riskScore: 0, activity: 0,
      best: null, worst: null, mostValuable: null, highestRisk: null,
      allocations: [], memePercent: 0, largeCapPercent: 0,
      riskLabel: 'N/A', insights: [], summary: 'Add coins to see analytics',
      totalInvested: 0, tradeCount: 0, avgTradeSize: 0,
    }
  }

  // Allocations
  const allocations = holdings.map((h) => ({
    ...h,
    pct: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
    risk: riskLevel(h.coin_id),
  })).sort((a, b) => b.currentValue - a.currentValue)

  const maxPct = Math.max(...allocations.map((a) => a.pct))
  const coinCount = allocations.length

  // Diversification score (out of 25)
  let diversification = 5
  if (coinCount >= 5 && maxPct <= 40) diversification = 25
  else if (coinCount >= 3 && maxPct <= 60) diversification = 18
  else if (coinCount >= 2 && maxPct <= 80) diversification = 12

  // Performance score (out of 25)
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  let performance = 5
  if (pnlPct > 20) performance = 25
  else if (pnlPct > 0) performance = 18
  else if (pnlPct > -20) performance = 10

  // Risk analysis
  const memeValue = allocations.filter((a) => a.risk === 'High').reduce((s, a) => s + a.currentValue, 0)
  const largeCapValue = allocations.filter((a) => a.risk === 'Low').reduce((s, a) => s + a.currentValue, 0)
  const memePercent = totalValue > 0 ? (memeValue / totalValue) * 100 : 0
  const largeCapPercent = totalValue > 0 ? (largeCapValue / totalValue) * 100 : 0
  const midPercent = 100 - memePercent - largeCapPercent

  let riskLabel = 'Moderate'
  let riskScore = 15
  if (memePercent > 50) { riskLabel = 'Aggressive'; riskScore = 5 }
  else if (memePercent < 20 && largeCapPercent > 50) { riskLabel = 'Conservative'; riskScore = 25 }
  else if (memePercent < 30) { riskScore = 20 }

  // Activity score (out of 25)
  const tradeCount = transactions?.length || 0
  let activity = 5
  if (tradeCount > 20) activity = 25
  else if (tradeCount > 10) activity = 20
  else if (tradeCount > 5) activity = 15
  else if (tradeCount > 0) activity = 10

  const score = diversification + performance + riskScore + activity

  // Best/Worst performers
  const withPnl = allocations.filter((a) => a.pnlPercent != null)
  const best = withPnl.length ? withPnl.reduce((a, b) => a.pnlPercent > b.pnlPercent ? a : b) : null
  const worst = withPnl.length ? withPnl.reduce((a, b) => a.pnlPercent < b.pnlPercent ? a : b) : null
  const mostValuable = allocations[0] || null
  const highRiskHoldings = allocations.filter((a) => a.risk === 'High')
  const highestRisk = highRiskHoldings.length
    ? highRiskHoldings.reduce((a, b) => a.currentValue > b.currentValue ? a : b)
    : null

  // Insights
  const insights = []
  if (best && best.pnlPercent > 10) {
    insights.push({
      icon: '\u2705', title: `Strong ${best.coin_symbol || best.symbol} position`,
      text: `Your ${(best.coin_symbol || best.symbol).toUpperCase()} is up ${best.pnlPercent.toFixed(1)}%. Great entry!`,
      borderColor: '#05B169',
    })
  }
  if (memePercent > 30) {
    insights.push({
      icon: '\u26A0\uFE0F', title: 'High meme coin exposure',
      text: `${memePercent.toFixed(0)}% of your portfolio is in high-risk meme coins. Consider reducing if risk-averse.`,
      actionLabel: 'Rebalance', actionTo: '/convert', borderColor: '#F59E0B',
    })
  }
  if (allocations.some((a) => ['ethereum', 'solana', 'binancecoin'].includes(a.coin_id))) {
    insights.push({
      icon: '\uD83D\uDCA1', title: 'Staking opportunity',
      text: 'You hold coins that can earn staking rewards. Start staking for passive income.',
      actionLabel: 'Explore staking', actionTo: '/staking', borderColor: '#0052FF',
    })
  }
  if (coinCount < 3) {
    insights.push({
      icon: '\uD83D\uDCA1', title: 'Diversification tip',
      text: 'Adding more coins could reduce your overall portfolio volatility.',
      actionLabel: 'Browse markets', actionTo: '/markets', borderColor: '#0052FF',
    })
  }
  if (worst && worst.pnlPercent < -20) {
    insights.push({
      icon: '\u26A0\uFE0F', title: 'Unrealized losses',
      text: `${(worst.coin_symbol || worst.symbol).toUpperCase()} is down ${Math.abs(worst.pnlPercent).toFixed(1)}%. Consider your exit strategy or averaging down.`,
      borderColor: '#F59E0B',
    })
  }
  if (largeCapPercent > 60) {
    insights.push({
      icon: '\u2705', title: 'Solid large-cap foundation',
      text: `${largeCapPercent.toFixed(0)}% in BTC/ETH provides stability. Well positioned for long-term growth.`,
      borderColor: '#05B169',
    })
  }

  // Summary
  let summary = 'Add more coins and trades to improve your score.'
  if (score >= 80) summary = 'Excellent portfolio with strong diversification and performance.'
  else if (score >= 60) summary = 'Good portfolio balance. Consider optimizing risk exposure.'
  else if (score >= 40) summary = 'Fair portfolio. Diversify more and review underperformers.'

  const totalInvested = holdings.reduce((s, h) => s + h.costBasis, 0)
  const avgTradeSize = tradeCount > 0 ? totalInvested / tradeCount : 0

  return {
    score, diversification, performance, riskScore, activity,
    best, worst, mostValuable, highestRisk,
    allocations, memePercent, largeCapPercent, midPercent,
    riskLabel, insights, summary,
    totalInvested, tradeCount, avgTradeSize,
  }
}

/* ── Donut Tooltip ────────────────────────────────────────────────────── */

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1E2025] border border-[#2A2D35] rounded-lg px-3 py-2 text-xs">
      <div className="text-white font-semibold">{d.name}</div>
      <div className="text-[#8A919E]">{d.pct.toFixed(1)}% &middot; {formatUSD(d.value)}</div>
    </div>
  )
}

/* ── Main Analytics Page ──────────────────────────────────────────────── */

export default function Analytics() {
  const { holdings, totalValue, totalPnl, totalCost, loading } = useHoldings()
  const { transactions } = usePortfolio()
  const [updated] = useState(() => new Date())

  const analytics = useMemo(
    () => calcAnalytics(holdings, totalValue, totalPnl, totalCost, transactions),
    [holdings, totalValue, totalPnl, totalCost, transactions]
  )

  const pieData = useMemo(() =>
    analytics.allocations.map((a) => ({
      name: (a.coin_symbol || a.symbol || '').toUpperCase(),
      value: a.currentValue,
      pct: a.pct,
    })), [analytics.allocations])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-[#1E2025] rounded" />
          <div className="h-64 bg-[#1E2025] rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[0,1,2,3].map(i=><div key={i} className="h-28 bg-[#1E2025] rounded-xl" />)}</div>
        </div>
      </div>
    )
  }

  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Deep insights into your crypto portfolio</p>
        </div>
        <span className="text-[#5B616E] text-xs">
          Updated {updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {holdings.length === 0 ? (
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl py-16 px-6 text-center">
          <div className="text-5xl mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8A919E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <h3 className="text-text-primary font-semibold text-lg mb-2">No holdings yet</h3>
          <p className="text-text-muted text-sm mb-6">Buy some coins to see your portfolio analytics.</p>
          <Link to="/markets" className="inline-block px-6 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold no-underline transition-colors">
            Browse Markets
          </Link>
        </div>
      ) : (
        <>
          {/* ── Section 1: Portfolio Score ───────────────────────── */}
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <ScoreGauge value={analytics.score} />
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-3">Portfolio Health Score</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Diversification', val: analytics.diversification, max: 25 },
                    { label: 'Performance', val: analytics.performance, max: 25 },
                    { label: 'Risk Management', val: analytics.riskScore, max: 25 },
                    { label: 'Activity', val: analytics.activity, max: 25 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8A919E]">{s.label}</span>
                        <span className="text-white font-medium">{s.val}/{s.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1E2025]">
                        <div className="h-1.5 rounded-full bg-[#0052FF] transition-all" style={{ width: `${(s.val / s.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[#8A919E] text-sm">{analytics.summary}</p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Performance Stats ─────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
              <div className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2">Best Performer</div>
              {analytics.best ? (
                <div className="flex items-center gap-2">
                  <CoinLogo id={analytics.best.coin_id} image={analytics.best.image} symbol={analytics.best.coin_symbol || analytics.best.symbol} size={24} />
                  <div>
                    <div className="text-white text-sm font-medium">{(analytics.best.coin_symbol || analytics.best.symbol || '').toUpperCase()}</div>
                    <div className="text-[#05B169] text-xs font-semibold">{formatPercent(analytics.best.pnlPercent)}</div>
                  </div>
                </div>
              ) : <div className="text-[#5B616E] text-sm">-</div>}
            </div>
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
              <div className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2">Worst Performer</div>
              {analytics.worst ? (
                <div className="flex items-center gap-2">
                  <CoinLogo id={analytics.worst.coin_id} image={analytics.worst.image} symbol={analytics.worst.coin_symbol || analytics.worst.symbol} size={24} />
                  <div>
                    <div className="text-white text-sm font-medium">{(analytics.worst.coin_symbol || analytics.worst.symbol || '').toUpperCase()}</div>
                    <div className="text-[#F6465D] text-xs font-semibold">{formatPercent(analytics.worst.pnlPercent)}</div>
                  </div>
                </div>
              ) : <div className="text-[#5B616E] text-sm">-</div>}
            </div>
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
              <div className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2">Most Valuable</div>
              {analytics.mostValuable ? (
                <div className="flex items-center gap-2">
                  <CoinLogo id={analytics.mostValuable.coin_id} image={analytics.mostValuable.image} symbol={analytics.mostValuable.coin_symbol || analytics.mostValuable.symbol} size={24} />
                  <div>
                    <div className="text-white text-sm font-medium">{(analytics.mostValuable.coin_symbol || analytics.mostValuable.symbol || '').toUpperCase()}</div>
                    <div className="text-[#8A919E] text-xs">{formatUSD(analytics.mostValuable.currentValue)} ({analytics.mostValuable.pct.toFixed(1)}%)</div>
                  </div>
                </div>
              ) : <div className="text-[#5B616E] text-sm">-</div>}
            </div>
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
              <div className="text-[#8A919E] text-xs uppercase tracking-wider font-semibold mb-2">Highest Risk</div>
              {analytics.highestRisk ? (
                <div className="flex items-center gap-2">
                  <CoinLogo id={analytics.highestRisk.coin_id} image={analytics.highestRisk.image} symbol={analytics.highestRisk.coin_symbol || analytics.highestRisk.symbol} size={24} />
                  <div>
                    <div className="text-white text-sm font-medium">{(analytics.highestRisk.coin_symbol || analytics.highestRisk.symbol || '').toUpperCase()}</div>
                    <RiskBadge level="High" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-white text-sm">None</div>
                  <RiskBadge level="Low" />
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Breakdown ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Allocation */}
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Allocation Analysis</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  analytics.diversification >= 18
                    ? 'bg-[#05B169]/15 text-[#05B169]'
                    : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                }`}>
                  {analytics.diversification >= 18 ? 'Well diversified' : 'Concentrated'}
                </span>
              </div>
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {analytics.allocations.slice(0, 8).map((a, i) => (
                  <div key={a.coin_id} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[#8A919E]">{(a.coin_symbol || a.symbol || '').toUpperCase()}</span>
                    <span className="text-white font-medium ml-auto">{a.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Risk Analysis</h3>
              <div className="text-center mb-4">
                <div className={`text-2xl font-bold ${
                  analytics.riskLabel === 'Conservative' ? 'text-[#05B169]' :
                  analytics.riskLabel === 'Aggressive' ? 'text-[#F6465D]' : 'text-[#F59E0B]'
                }`}>{analytics.riskLabel}</div>
                <div className="text-[#8A919E] text-xs mt-1">Overall risk profile</div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Large caps (BTC, ETH)', pct: analytics.largeCapPercent, level: 'Low' },
                  { label: 'Mid caps', pct: analytics.midPercent, level: 'Medium' },
                  { label: 'Meme / High risk', pct: analytics.memePercent, level: 'High' },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#8A919E]">{r.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{r.pct.toFixed(1)}%</span>
                        <RiskBadge level={r.level} />
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1E2025]">
                      <div className="h-1.5 rounded-full transition-all" style={{
                        width: `${r.pct}%`,
                        backgroundColor: riskColor(r.level).text,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-[#0A0B0D] rounded-lg p-3">
                <div className="text-[#8A919E] text-xs">
                  {analytics.riskLabel === 'Conservative'
                    ? 'Your portfolio leans toward stability. Good for long-term holding.'
                    : analytics.riskLabel === 'Aggressive'
                      ? 'High meme exposure increases volatility. Consider adding large caps.'
                      : 'Balanced risk profile. Monitor meme coin positions closely.'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 5: Coin Analysis Table ───────────────────── */}
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl overflow-hidden mb-6">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-white font-semibold text-sm">Coin Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2025] text-left text-xs uppercase tracking-widest text-[#8A919E]">
                    <th className="py-3 px-4 font-medium">Coin</th>
                    <th className="py-3 px-4 font-medium hidden sm:table-cell">Alloc</th>
                    <th className="py-3 px-4 font-medium hidden lg:table-cell">Qty</th>
                    <th className="py-3 px-4 font-medium hidden lg:table-cell">Avg Buy</th>
                    <th className="py-3 px-4 font-medium hidden sm:table-cell">Price</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">Invested</th>
                    <th className="py-3 px-4 font-medium">Value</th>
                    <th className="py-3 px-4 font-medium">P&L</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">Risk</th>
                    <th className="py-3 px-4 font-medium hidden lg:table-cell">7d</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.allocations.map((a, i) => {
                    const sym = (a.coin_symbol || a.symbol || '').toUpperCase()
                    return (
                      <tr key={a.coin_id} className={`border-b border-[#1E2025] last:border-b-0 ${i % 2 === 0 ? 'bg-[#141519]' : 'bg-[#0A0B0D]'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <CoinLogo id={a.coin_id} image={a.image} symbol={sym} size={24} />
                            <div>
                              <div className="text-white font-medium text-xs">{a.coin_name || a.name}</div>
                              <div className="text-[#8A919E] text-[10px]">{sym}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 h-1.5 rounded-full bg-[#1E2025]">
                              <div className="h-1.5 rounded-full bg-[#0052FF]" style={{ width: `${a.pct}%` }} />
                            </div>
                            <span className="text-white text-xs">{a.pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white text-xs hidden lg:table-cell">{formatCrypto(a.quantity)}</td>
                        <td className="py-3 px-4 text-[#8A919E] text-xs hidden lg:table-cell">{formatUSD(a.buy_price_usd)}</td>
                        <td className="py-3 px-4 text-white text-xs hidden sm:table-cell">{formatUSD(a.currentPrice)}</td>
                        <td className="py-3 px-4 text-[#8A919E] text-xs hidden md:table-cell">{formatUSD(a.costBasis)}</td>
                        <td className="py-3 px-4 text-white text-xs font-medium">{formatUSD(a.currentValue)}</td>
                        <td className="py-3 px-4">
                          <div className={`text-xs font-medium ${a.pnl >= 0 ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                            {formatUSD(a.pnl)}
                          </div>
                          <div className={`text-[10px] ${a.pnlPercent >= 0 ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                            {formatPercent(a.pnlPercent)}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell"><RiskBadge level={a.risk} /></td>
                        <td className="py-3 px-4 hidden lg:table-cell"><Sparkline positive={a.pnlPercent >= 0} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 6: Insights ──────────────────────────────── */}
          {analytics.insights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold text-sm mb-4">Portfolio Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.insights.map((ins, i) => (
                  <InsightCard key={i} {...ins} />
                ))}
              </div>
            </div>
          )}

          {/* ── Section 7: Investment Summary ────────────────────── */}
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Investment Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Invested', value: formatUSD(analytics.totalInvested) },
                { label: 'Current Value', value: formatUSD(totalValue) },
                { label: 'Total P&L', value: formatUSD(totalPnl), colored: true, positive: totalPnl >= 0 },
                { label: 'P&L %', value: formatPercent(pnlPct), colored: true, positive: pnlPct >= 0 },
                { label: 'Trades Made', value: String(analytics.tradeCount) },
                { label: 'Avg Trade Size', value: formatUSD(analytics.avgTradeSize) },
                { label: 'Holdings', value: String(holdings.length) },
                { label: 'Risk Profile', value: analytics.riskLabel },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[#8A919E] text-xs mb-1">{s.label}</div>
                  <div className={`text-sm font-semibold ${
                    s.colored ? (s.positive ? 'text-[#05B169]' : 'text-[#F6465D]') : 'text-white'
                  }`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Dashboard Widget (exported) ──────────────────────────────────────── */

export function AnalyticsWidget() {
  const { holdings, totalValue, totalPnl, totalCost } = useHoldings()
  const { transactions } = usePortfolio()

  const analytics = useMemo(
    () => calcAnalytics(holdings, totalValue, totalPnl, totalCost, transactions),
    [holdings, totalValue, totalPnl, totalCost, transactions]
  )

  if (!holdings.length) return null

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">Portfolio Health</h3>
        <Link to="/analytics" className="text-primary-blue text-xs font-semibold no-underline hover:underline">View full analytics</Link>
      </div>
      <div className="flex items-center gap-4">
        <MiniGauge value={analytics.score} />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A919E]">Score</span>
            <span className="text-white font-medium">{analytics.score}/100</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8A919E]">Risk</span>
            <span className="text-white font-medium">{analytics.riskLabel}</span>
          </div>
          {analytics.best && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A919E]">Best</span>
              <span className="text-[#05B169] font-medium">{(analytics.best.coin_symbol || analytics.best.symbol || '').toUpperCase()} {formatPercent(analytics.best.pnlPercent)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
