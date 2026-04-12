import { useEffect, useMemo, useState } from 'react'
import { getTopMarkets } from '../lib/coingecko'
import { formatUSD, formatNumber } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import {
  CATEGORY_TABS,
  filterByCategory,
  filterBySearch,
} from '../utils/coinCategories'
import CoinSearch from '../components/CoinSearch'
import InvestModal from '../components/InvestModal'
import { INVEST_WALLETS } from './Invest'

function MarketLogo({ coin }) {
  const [errored, setErrored] = useState(false)
  const src = getCoinImageUrl(coin.id, coin.image)
  if (!src || errored) {
    return (
      <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-[10px] font-bold text-text-primary uppercase flex-shrink-0">
        {(coin.symbol || '').slice(0, 3)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={coin.symbol}
      onError={() => setErrored(true)}
      className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0"
    />
  )
}

function fmtPct(value) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(2)}%`
}

function Skeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-card-border" />
            <div className="flex-1 h-4 rounded bg-card-border" />
            <div className="w-20 h-4 rounded bg-card-border" />
            <div className="w-16 h-4 rounded bg-card-border" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Markets() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [category, setCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [investCoin, setInvestCoin] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      // 5 pages × 50 coins = top-250 by market cap
      const data = await getTopMarkets(5, 50)
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No market data')
      }
      setCoins(data)
      setErrorMsg('')
    } catch (err) {
      console.error('Failed to load markets:', err)
      setErrorMsg('Live data from CoinGecko is temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 180000)
    return () => clearInterval(t)
  }, [])

  const visibleCoins = useMemo(
    () => filterBySearch(filterByCategory(coins, category), search),
    [coins, category, search]
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Markets
        </h1>
        <div className="text-xs text-text-muted">
          {coins.length} coins tracked
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Search + coin picker */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
          />
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="px-4 py-3 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors md:w-auto"
        >
          Search all CoinGecko
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => {
          const active = tab === category
          return (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary-blue border-primary-blue text-white'
                  : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {loading && coins.length === 0 ? (
        <Skeleton />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                  <th className="py-3 px-4 font-medium">Asset</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">24h</th>
                  <th className="py-3 px-4 font-medium">7d</th>
                  <th className="py-3 px-4 font-medium">Market cap</th>
                  <th className="py-3 px-4 font-medium">Volume</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoins.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-text-muted text-sm"
                    >
                      No coins match this filter.
                    </td>
                  </tr>
                )}
                {visibleCoins.map((coin) => {
                  const c24 = coin.price_change_percentage_24h
                  const c7d = coin.price_change_percentage_7d_in_currency
                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <MarketLogo coin={coin} />
                          <div>
                            <div className="text-text-primary font-semibold">
                              {coin.name}
                            </div>
                            <div className="text-text-muted text-xs uppercase">
                              {coin.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-text-primary">
                        {formatUSD(coin.current_price)}
                      </td>
                      <td
                        className={`py-4 px-4 font-medium ${
                          (c24 ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {fmtPct(c24)}
                      </td>
                      <td
                        className={`py-4 px-4 font-medium ${
                          (c7d ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {fmtPct(c7d)}
                      </td>
                      <td className="py-4 px-4 text-text-primary">
                        ${formatNumber(coin.market_cap)}
                      </td>
                      <td className="py-4 px-4 text-text-muted">
                        ${formatNumber(coin.total_volume)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setInvestCoin(coin)}
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

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 bg-black/70 backdrop-blur-sm"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-card-bg border border-card-border rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-text-primary font-semibold mb-3">
              Search any coin
            </div>
            <CoinSearch
              onSelect={(picked) => {
                setPickerOpen(false)
                setInvestCoin({
                  id: picked.id,
                  name: picked.name,
                  symbol: picked.symbol,
                  image: picked.thumb || picked.large || picked.image || null,
                  current_price: null,
                })
              }}
            />
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
