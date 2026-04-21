import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useHoldings } from '../hooks/useHoldings'
import { formatUSD } from '../utils/formatters'

const RANGES = [
  { key: '1W', days: 7 },
  { key: '1M', days: 30 },
  { key: '3M', days: 90 },
  { key: '1Y', days: 365 },
]

function generateSeries(days, currentValue) {
  if (!currentValue || currentValue <= 0) currentValue = 0
  const points = []
  const now = Date.now()
  const count = Math.min(days, 30)
  const step = (days * 24 * 60 * 60 * 1000) / count
  // start ~80-90% of current value and walk toward it
  let value = currentValue > 0 ? currentValue * (0.8 + Math.random() * 0.1) : 0
  for (let i = count; i >= 0; i--) {
    const t = now - i * step
    if (currentValue > 0) {
      const drift = (currentValue - value) * (1 / (i + 2))
      const noise = (Math.random() - 0.48) * (currentValue * 0.02)
      value = Math.max(0, value + drift + noise)
    }
    points.push({
      date: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(0, value),
    })
  }
  if (points.length && currentValue > 0) points[points.length - 1].value = currentValue
  return points
}

function fmtAxisValue(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`
  return `$${v.toFixed(0)}`
}

export default function PortfolioChart() {
  const { totalValue } = useHoldings()
  const [range, setRange] = useState('1M')

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days || 30
    return generateSeries(days, totalValue || 1000)
  }, [range, totalValue])

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-text-muted font-medium">
            Portfolio value
          </div>
          <div className="text-2xl font-bold text-text-primary tracking-tight">
            {formatUSD(totalValue)}
          </div>
        </div>
        <div className="flex gap-1 bg-root-bg border border-card-border rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border-none transition-colors ${
                range === r.key
                  ? 'bg-primary-blue text-white'
                  : 'bg-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
        {!data || data.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A919E' }}>
            Loading chart...
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2025" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#5B616E"
              tick={{ fill: '#8A919E', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#5B616E"
              tick={{ fill: '#8A919E', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtAxisValue}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141519',
                border: '1px solid #2C2F36',
                borderRadius: 8,
                color: '#fff',
              }}
              formatter={(v) => [formatUSD(v), 'Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0052FF"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0052FF' }}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
