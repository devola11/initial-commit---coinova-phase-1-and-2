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
  const points = []
  const now = Date.now()
  const step = (days * 24 * 60 * 60 * 1000) / Math.min(days, 60)
  // simulate walk ending at current value
  let value = currentValue * (0.7 + Math.random() * 0.2)
  const count = Math.min(days, 60)
  for (let i = count; i >= 0; i--) {
    const t = now - i * step
    const noise = (Math.random() - 0.45) * (currentValue * 0.04)
    value = value + noise + (currentValue - value) * (1 / (i + 1))
    points.push({
      date: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(0, value),
    })
  }
  if (points.length) points[points.length - 1].value = currentValue
  return points
}

export default function PortfolioChart() {
  const { totalValue } = useHoldings()
  const [range, setRange] = useState('1M')

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days || 30
    return generateSeries(days, totalValue || 1000)
  }, [range, totalValue])

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
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
      <div className="h-64">
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
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
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
      </div>
    </div>
  )
}
