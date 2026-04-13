import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useHoldings } from '../hooks/useHoldings'
import { formatUSD } from '../utils/formatters'

const PALETTE = [
  '#0052FF',
  '#F7931A',
  '#627EEA',
  '#14F195',
  '#F3BA2F',
  '#8247E5',
  '#23292F',
  '#E84142',
  '#2775CA',
  '#FF007A',
]

export default function AllocationChart() {
  const { holdings, totalValue, loading } = useHoldings()

  if (loading) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading allocation...</div>
      </div>
    )
  }

  if (!holdings.length) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-6 h-full flex flex-col items-center justify-center gap-2">
        <div className="text-text-muted text-sm">No holdings yet. Buy your first coin.</div>
      </div>
    )
  }

  const data = holdings
    .map((h, i) => ({
      name: h.symbol?.toUpperCase() || h.name,
      fullName: h.name,
      value: h.currentValue,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((d) => d.value > 0)

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6 h-full">
      <div className="text-xs uppercase tracking-widest text-text-muted font-medium mb-4">
        Allocation
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141519',
                  border: '1px solid #2C2F36',
                  borderRadius: 8,
                  color: '#fff',
                }}
                formatter={(v) => formatUSD(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full mt-2 space-y-2">
          {data.map((d) => {
            const pct = totalValue > 0 ? (d.value / totalValue) * 100 : 0
            return (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <div className="text-text-primary truncate">{d.fullName}</div>
                  <div className="text-text-muted text-xs">{d.name}</div>
                </div>
                <div className="text-text-muted text-xs ml-2 flex-shrink-0">
                  {pct.toFixed(1)}% - {formatUSD(d.value)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
