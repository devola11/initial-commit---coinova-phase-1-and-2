import { usePortfolio } from '../context/PortfolioContext'
import { formatUSD, formatCrypto } from '../utils/formatters'

export default function TransactionHistory() {
  const { transactions } = usePortfolio()

  if (!transactions.length) {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center text-text-muted text-sm">
        No transactions yet.
      </div>
    )
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-card-border">
        <div className="text-text-primary font-semibold">Transaction history</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Coin</th>
              <th className="py-3 px-4 font-medium">Quantity</th>
              <th className="py-3 px-4 font-medium">Price</th>
              <th className="py-3 px-4 font-medium">Total</th>
              <th className="py-3 px-4 font-medium">Fee</th>
              <th className="py-3 px-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const isBuy = t.type === 'buy'
              return (
                <tr
                  key={t.id}
                  className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
                        isBuy
                          ? 'bg-profit/15 text-profit'
                          : 'bg-loss/15 text-loss'
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-primary">
                    {t.name}{' '}
                    <span className="text-text-muted uppercase text-xs">
                      {t.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-primary">
                    {formatCrypto(t.quantity)}
                  </td>
                  <td className="py-3 px-4 text-text-primary">
                    {formatUSD(t.price_usd)}
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium">
                    {formatUSD(t.total_usd)}
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {formatUSD(t.fee_usd)}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {new Date(t.created_at).toLocaleString()}
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
