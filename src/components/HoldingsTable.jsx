import { useState } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { formatUSD, formatCrypto } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'

// Deterministic color per symbol so the fallback circle stays stable across
// renders and is distinguishable at a glance.
const FALLBACK_COLORS = [
  '#f7931a', '#627eea', '#14f195', '#f3ba2f', '#2a5ada',
  '#e84142', '#8247e5', '#0033ad', '#345d9d', '#26a17b',
]

function colorForSymbol(sym) {
  const s = String(sym || '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

function initialsFor(symbol, name) {
  const src = symbol || name || '?'
  return String(src).slice(0, 2).toUpperCase()
}

function CoinLogo({ coinId, symbol, name, storedImage }) {
  const [errored, setErrored] = useState(false)
  const primarySrc = getCoinImageUrl(coinId, storedImage)
  const sym = (symbol || '').toLowerCase()

  if (!primarySrc || errored) {
    return (
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
        style={{ backgroundColor: colorForSymbol(sym || name) }}
      >
        {initialsFor(symbol, name)}
      </div>
    )
  }

  return (
    <img
      src={primarySrc}
      alt={symbol}
      onError={() => setErrored(true)}
      className="w-8 h-8 rounded-full flex-shrink-0 bg-white/5"
    />
  )
}

function format2dp(value) {
  if (value == null || Number.isNaN(value)) return '0.00%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(2)}%`
}

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
            {holdings.map((h) => {
              const coinName = h.coin_name || h.name
              const coinSymbol = h.coin_symbol || h.symbol
              return (
                <tr
                  key={h.id}
                  className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <CoinLogo
                        coinId={h.coin_id}
                        symbol={coinSymbol}
                        name={coinName}
                        storedImage={h.image}
                      />
                      <div>
                        <div className="text-text-primary font-semibold">
                          {coinName}
                        </div>
                        <div className="text-text-muted text-xs uppercase">
                          {coinSymbol}
                        </div>
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
                    {format2dp(h.change24h)}
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
                    <div className="text-xs">{format2dp(h.pnlPercent)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() =>
                          onBuy?.({
                            id: h.coin_id,
                            symbol: coinSymbol,
                            name: coinName,
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
