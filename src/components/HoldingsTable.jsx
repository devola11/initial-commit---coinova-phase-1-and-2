import { useHoldings } from '../hooks/useHoldings'
import { formatUSD, formatPercent, formatCrypto } from '../utils/formatters'

export default function HoldingsTable({ onBuy, onSell }) {
  const { holdings, loading } = useHoldings()

  if (loading) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center text-text-muted text-sm">
        Loading holdings...
      </div>
    )
  }

  if (!holdings.length) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-10 text-center">
        <div className="text-text-primary font-semibold mb-2">No holdings yet.</div>
        <div className="text-text-muted text-sm mb-5">Buy your first coin.</div>
        {onBuy && (
          <button
            onClick={() => onBuy(null)}
            className="px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
          >
            Buy coin
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
              <th className="py-3 px-4 font-medium">Asset</th>
              <th className="py-3 px-4 font-medium">Price</th>
              <th className="py-3 px-4 font-medium">24h</th>
              <th className="py-3 px-4 font-medium">Holdings</th>
              <th className="py-3 px-4 font-medium">Value</th>
              <th className="py-3 px-4 font-medium">P&amp;L</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr
                key={h.id}
                className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {h.image && (
                      <img
                        src={h.image}
                        alt={h.symbol}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="text-text-primary font-semibold">{h.name}</div>
                      <div className="text-text-muted text-xs uppercase">{h.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-text-primary">
                  {formatUSD(h.currentPrice)}
                </td>
                <td
                  className={`py-4 px-4 font-medium ${
                    h.change24h >= 0 ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {formatPercent(h.change24h)}
                </td>
                <td className="py-4 px-4 text-text-primary">
                  {formatCrypto(h.quantity)}
                </td>
                <td className="py-4 px-4 text-text-primary font-medium">
                  {formatUSD(h.currentValue)}
                </td>
                <td
                  className={`py-4 px-4 font-medium ${
                    h.pnl >= 0 ? 'text-profit' : 'text-loss'
                  }`}
                >
                  <div>{formatUSD(h.pnl)}</div>
                  <div className="text-xs">{formatPercent(h.pnlPercent)}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() =>
                        onBuy?.({
                          id: h.coin_id,
                          symbol: h.symbol,
                          name: h.name,
                          image: h.image,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-semibold border-none cursor-pointer transition-colors"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => onSell?.(h)}
                      className="px-3 py-1.5 rounded-lg bg-transparent text-text-primary border border-card-border hover:border-loss hover:text-loss text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
