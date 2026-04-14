import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ── Helpers ──────────────────────────────────────────────────────────── */

function classify(val) {
  const v = Number(val)
  if (v <= 25) return { label: 'Extreme Fear', color: '#F6465D' }
  if (v <= 45) return { label: 'Fear', color: '#FF8C00' }
  if (v <= 55) return { label: 'Neutral', color: '#F59E0B' }
  if (v <= 75) return { label: 'Greed', color: '#22C55E' }
  return { label: 'Extreme Greed', color: '#05B169' }
}

function dotForValue(v) {
  const n = Number(v)
  if (n <= 25) return '\u{1F534}' // red circle
  if (n <= 45) return '\u{1F7E0}' // orange circle
  if (n <= 55) return '\u{1F7E1}' // yellow circle
  if (n <= 75) return '\u{1F7E2}' // green circle
  return '\u{1F7E2}'
}

/* ── SVG Gauge ────────────────────────────────────────────────────────── */

function Gauge({ value }) {
  const v = Number(value) || 0
  const { color } = classify(v)

  // Arc from 180° (left) to 0° (right) - a top semicircle
  const cx = 120, cy = 110, r = 90
  const startAngle = 180
  const endAngle = 0
  const sweep = startAngle - endAngle // 180

  // Color stop angles (fractions of the sweep)
  const zones = [
    { pct: 0.25, color: '#F6465D' },
    { pct: 0.45, color: '#FF8C00' },
    { pct: 0.55, color: '#F59E0B' },
    { pct: 0.75, color: '#22C55E' },
    { pct: 1.00, color: '#05B169' },
  ]

  function arcPoint(angle) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
  }

  function arcPath(fromPct, toPct) {
    const a1 = startAngle - fromPct * sweep
    const a2 = startAngle - toPct * sweep
    const p1 = arcPoint(a1)
    const p2 = arcPoint(a2)
    const largeArc = Math.abs(a1 - a2) > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`
  }

  // Needle
  const needleAngle = startAngle - (v / 100) * sweep
  const needleTip = arcPoint(needleAngle)
  const needleLen = r - 14
  const needleEnd = {
    x: cx + needleLen * Math.cos((needleAngle * Math.PI) / 180),
    y: cy - needleLen * Math.sin((needleAngle * Math.PI) / 180),
  }

  return (
    <svg viewBox="0 0 240 140" className="w-full max-w-[280px] mx-auto">
      {/* Background track */}
      <path d={arcPath(0, 1)} fill="none" stroke="#1E2025" strokeWidth="16" strokeLinecap="round" />

      {/* Color zones */}
      {zones.map((zone, i) => {
        const from = i === 0 ? 0 : zones[i - 1].pct
        return (
          <path
            key={i}
            d={arcPath(from, zone.pct)}
            fill="none"
            stroke={zone.color}
            strokeWidth="16"
            strokeLinecap="butt"
            opacity="0.85"
          />
        )
      })}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleEnd.x} y2={needleEnd.y}
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="white" />

      {/* Value */}
      <text x={cx} y={cy + 30} textAnchor="middle" fill="white" fontSize="36" fontWeight="700">
        {v}
      </text>
      <text x={cx} y={cy + 48} textAnchor="middle" fill={color} fontSize="13" fontWeight="600">
        {classify(v).label}
      </text>
    </svg>
  )
}

/* ── Chart tooltip ────────────────────────────────────────────────────── */

function FGTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  const { label, color } = classify(d.value)
  return (
    <div className="bg-[#1E2025] border border-[#2A2D35] rounded-lg px-3 py-2 text-xs">
      <div className="text-white font-semibold">{d.value} - <span style={{ color }}>{label}</span></div>
      <div className="text-[#8A919E]">{d.dateLabel}</div>
    </div>
  )
}

/* ── Shared data hook ─────────────────────────────────────────────────── */

export function useFearGreed() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/feargreed', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.data) setData(json.data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}

/* ── Small badge for CoinDetail ───────────────────────────────────────── */

export function FearGreedBadge() {
  const { data, loading } = useFearGreed()

  if (loading || !data || data.length === 0) return null

  const current = data[0]
  const v = Number(current.value)
  const { label, color } = classify(v)

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: color + '18' }}>
      <span className="text-xs" style={{ color }}>
        {dotForValue(v)} Market Sentiment: {v} - {label}
      </span>
    </div>
  )
}

/* ── Landing page version ─────────────────────────────────────────────── */

export function FearGreedLanding() {
  const { data, loading } = useFearGreed()

  if (loading || !data || data.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#0A0B0D' }}>
        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Loading market sentiment...</div>
      </div>
    )
  }

  const current = data[0]
  const v = Number(current.value)
  const { label, color } = classify(v)

  return (
    <div className="rounded-2xl p-6 sm:p-10" style={{ backgroundColor: '#0A0B0D' }}>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
        How's the market feeling today?
      </h2>
      <p className="text-sm mb-8" style={{ color: '#8A919E' }}>Crypto Fear & Greed Index</p>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <Gauge value={v} />
        </div>
        <div className="text-center sm:text-left space-y-4">
          <div>
            <div className="text-5xl font-bold text-white">{v}</div>
            <div className="text-xl font-semibold mt-1" style={{ color }}>{label}</div>
          </div>
          <p className="text-sm max-w-xs" style={{ color: '#8A919E' }}>
            {v <= 25
              ? 'Markets are extremely fearful - historically a buying opportunity.'
              : v <= 45
                ? 'Investors are cautious. Fear often precedes rebounds.'
                : v <= 55
                  ? 'The market is undecided right now.'
                  : v <= 75
                    ? 'Optimism is rising. Stay alert for corrections.'
                    : 'Extreme greed detected - the market may correct soon.'}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Full dashboard widget ────────────────────────────────────────────── */

export default function FearGreedIndex() {
  const { data, loading } = useFearGreed()

  const chartData = useMemo(() => {
    if (!data) return []
    return [...data]
      .reverse()
      .map((d) => {
        const ts = Number(d.timestamp) * 1000
        return {
          value: Number(d.value),
          dateLabel: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: ts,
        }
      })
  }, [data])

  if (loading) {
    return (
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
        <div className="h-60 flex items-center justify-center text-[#8A919E] text-sm animate-pulse">
          Loading Fear & Greed Index...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) return null

  const current = data[0]
  const yesterday = data[1]
  const lastWeek = data[7]
  const lastMonth = data[29] || data[data.length - 1]

  const v = Number(current.value)
  const { color } = classify(v)

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Fear & Greed Index</h3>
        <span className="text-[#5B616E] text-xs">Updated daily</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: gauge + comparisons */}
        <div>
          <Gauge value={v} />

          {/* Comparison rows */}
          <div className="mt-4 space-y-2">
            {[
              { label: 'Yesterday', item: yesterday },
              { label: 'Last week', item: lastWeek },
              { label: 'Last month', item: lastMonth },
            ].map(({ label, item }) => {
              if (!item) return null
              const iv = Number(item.value)
              const ic = classify(iv)
              return (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-[#8A919E]">{label}</span>
                  <span>
                    <span className="text-white font-medium">{iv}</span>
                    <span className="ml-1.5" style={{ color: ic.color }}>({ic.label})</span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* What it means */}
          <div className="mt-4 bg-[#0A0B0D] rounded-lg p-3 space-y-1.5">
            <div className="text-[#8A919E] text-[11px] uppercase tracking-wider font-semibold mb-1">What it means</div>
            <div className="text-[#8A919E] text-xs flex items-start gap-2">
              <span className="text-[#F6465D] flex-shrink-0">&#9660;</span>
              Extreme Fear may be a buying opportunity
            </div>
            <div className="text-[#8A919E] text-xs flex items-start gap-2">
              <span className="text-[#05B169] flex-shrink-0">&#9650;</span>
              Extreme Greed means market may correct soon
            </div>
          </div>
        </div>

        {/* Right: historical chart */}
        <div>
          <div className="text-[#8A919E] text-xs mb-2">Last 30 days</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#8A919E', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#8A919E', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<FGTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#8A919E] text-sm">
              No historical data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
