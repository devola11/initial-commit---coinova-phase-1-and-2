import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { getTopMarkets } from '../lib/coingecko'
import { formatUSD, formatNumber } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import InvestModal from '../components/InvestModal'
import { INVEST_WALLETS } from './Invest'

function fmtPct(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(2)}%`
}

function CoinLogo({ coin }) {
  const [errored, setErrored] = useState(false)
  const src = getCoinImageUrl(coin.coin_id || coin.id, coin.coin_image || coin.image)
  if (!src || errored) {
    return (
      <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-[10px] font-bold text-text-primary uppercase flex-shrink-0">
        {(coin.coin_symbol || coin.symbol || '').slice(0, 3)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={coin.coin_symbol || coin.symbol}
      onError={() => setErrored(true)}
      className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0"
    />
  )
}

function StarIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : '#8A919E'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function Watchlist() {
  const navigate = useNavigate()
  const { watchlist, loading: wlLoading, toggle } = useWatchlist()
  const [prices, setPrices] = useState({})
  const [, setPricesLoading] = useState(true)
  const [investCoin, setInvestCoin] = useState(null)

  // Fetch live market data to get prices for watched coins
  useEffect(() => {
    let cancelled = false
    setPricesLoading(true)
    getTopMarkets(5, 50)
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        const map = {}
        data.forEach((c) => { map[c.id] = c })
        setPrices(map)
      })
      .catch(() => {})
      .finally(() => !cancelled && setPricesLoading(false))
    return () => { cancelled = true }
  }, [])

  const enriched = watchlist.map((w) => {
    const live = prices[w.coin_id]
    return {
      ...w,
      current_price: live?.current_price ?? null,
      price_change_percentage_24h: live?.price_change_percentage_24h ?? null,
      price_change_percentage_7d_in_currency: live?.price_change_percentage_7d_in_currency ?? null,
      market_cap: live?.market_cap ?? null,
    }
  })

  const isEmpty = !wlLoading && watchlist.length === 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Watchlist
        </h1>
        <p className="text-text-muted text-sm mt-1">Track your favorite coins</p>
      </div>

      {wlLoading ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 rounded bg-card-border" />
              <div className="w-8 h-8 rounded-full bg-card-border" />
              <div className="flex-1 h-4 rounded bg-card-border" />
              <div className="w-20 h-4 rounded bg-card-border" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="bg-card-bg border border-card-border rounded-xl py-16 px-6 text-center">
          <div className="text-5xl mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8A919E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <h3 className="text-text-primary font-semibold text-lg mb-2">
            No coins in watchlist yet
          </h3>
          <p className="text-text-muted text-sm mb-6">
            Star coins in the Markets page to track them here.
          </p>
          <Link
            to="/markets"
            className="inline-block px-6 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold no-underline transition-colors"
          >
            Browse Markets
          </Link>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                  <th className="py-3 px-3 font-medium w-10"></th>
                  <th className="py-3 px-4 font-medium">Coin</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">24h</th>
                  <th className="py-3 px-4 font-medium hidden md:table-cell">7d</th>
                  <th className="py-3 px-4 font-medium hidden lg:table-cell">Market Cap</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((coin) => {
                  const c24 = coin.price_change_percentage_24h
                  const c7d = coin.price_change_percentage_7d_in_currency
                  return (
                    <tr
                      key={coin.coin_id}
                      className="border-b border-card-border last:border-b-0 hover:bg-[#1a1d23] transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggle({
                              id: coin.coin_id,
                              symbol: coin.coin_symbol,
                              name: coin.coin_name,
                              image: coin.coin_image,
                            })
                          }}
                          className="bg-transparent border-none cursor-pointer p-1 hover:scale-110 transition-transform"
                        >
                          <StarIcon filled={true} />
                        </button>
                      </td>
                      <td
                        className="py-4 px-4"
                        onClick={() => navigate(`/coin/${coin.coin_id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <CoinLogo coin={coin} />
                          <div>
                            <div className="text-text-primary font-semibold">
                              {coin.coin_name}
                            </div>
                            <div className="text-text-muted text-xs uppercase">
                              {coin.coin_symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-text-primary">
                        {coin.current_price != null
                          ? formatUSD(coin.current_price)
                          : '-'}
                      </td>
                      <td
                        className={`py-4 px-4 font-medium ${
                          (c24 ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {fmtPct(c24)}
                      </td>
                      <td
                        className={`py-4 px-4 font-medium hidden md:table-cell ${
                          (c7d ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {fmtPct(c7d)}
                      </td>
                      <td className="py-4 px-4 text-text-primary hidden lg:table-cell">
                        {coin.market_cap != null
                          ? `$${formatNumber(coin.market_cap)}`
                          : '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setInvestCoin({
                              id: coin.coin_id,
                              name: coin.coin_name,
                              symbol: coin.coin_symbol,
                              image: coin.coin_image,
                              current_price: coin.current_price,
                            })
                          }}
                          className="px-4 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-semibold border-none cursor-pointer transition-colors"
                        >
                          Invest
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {investCoin && (
        <InvestModal
          coin={investCoin}
          wallets={INVEST_WALLETS}
          onClose={() => setInvestCoin(null)}
        />
      )}
    </div>
  )
}
