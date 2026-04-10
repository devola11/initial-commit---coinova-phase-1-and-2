import { useEffect, useState } from 'react'
import { getMarkets } from '../lib/coingecko'
import { formatUSD, formatPercent, formatNumber } from '../utils/formatters'
import CoinSearch from '../components/CoinSearch'
import BuyModal from '../components/BuyModal'

export default function Markets() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [buyCoin, setBuyCoin] = useState(null)

  async function load() {
    try {
      const data = await getMarkets(1, 50)
      setCoins(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
        Markets
      </h1>

      <div className="mb-6 max-w-xl">
        <CoinSearch onSelect={setBuyCoin} placeholder="Search any coin..." />
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                <th className="py-3 px-4 font-medium">#</th>
                <th className="py-3 px-4 font-medium">Asset</th>
                <th className="py-3 px-4 font-medium">Price</th>
                <th className="py-3 px-4 font-medium">24h</th>
                <th className="py-3 px-4 font-medium">7d</th>
                <th className="py-3 px-4 font-medium">Market cap</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-text-muted">
                    Loading markets...
                  </td>
                </tr>
              )}
              {!loading &&
                coins.map((coin) => {
                  const c24 = coin.price_change_percentage_24h ?? 0
                  const c7d = coin.price_change_percentage_7d_in_currency ?? 0
                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                    >
                      <td className="py-4 px-4 text-text-muted">
                        {coin.market_cap_rank}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coin.image}
                            alt={coin.symbol}
                            className="w-8 h-8 rounded-full"
                          />
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
                          c24 >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {formatPercent(c24)}
                      </td>
                      <td
                        className={`py-4 px-4 font-medium ${
                          c7d >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {formatPercent(c7d)}
                      </td>
                      <td className="py-4 px-4 text-text-primary">
                        ${formatNumber(coin.market_cap)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() =>
                            setBuyCoin({
                              id: coin.id,
                              symbol: coin.symbol,
                              name: coin.name,
                              image: coin.image,
                            })
                          }
                          className="px-4 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-semibold border-none cursor-pointer transition-colors"
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {buyCoin && <BuyModal coin={buyCoin} onClose={() => setBuyCoin(null)} />}
    </div>
  )
}
