import { useEffect, useState } from 'react'
import { getTopCoins } from '../lib/coingecko'
import { formatUSD, formatPercent, formatNumber } from '../utils/formatters'
import CoinSearch from '../components/CoinSearch'
import BuyModal from '../components/BuyModal'

// Top-10 fallback used when CoinGecko is blocked / rate-limited.
// Shape matches /coins/markets so the render code stays identical.
const FALLBACK_TOP_COINS = [
  { id: 'bitcoin',     market_cap_rank: 1,  name: 'Bitcoin',     symbol: 'btc',  image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',          current_price: 72000,    price_change_percentage_24h:  2.14, price_change_percentage_7d_in_currency:  4.80, market_cap: 1420000000000 },
  { id: 'ethereum',    market_cap_rank: 2,  name: 'Ethereum',    symbol: 'eth',  image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',       current_price: 2200,     price_change_percentage_24h: -1.20, price_change_percentage_7d_in_currency:  1.30, market_cap:  265000000000 },
  { id: 'tether',      market_cap_rank: 3,  name: 'Tether',      symbol: 'usdt', image: null,                                                                     current_price: 1.00,     price_change_percentage_24h:  0.01, price_change_percentage_7d_in_currency:  0.02, market_cap:  110000000000 },
  { id: 'binancecoin', market_cap_rank: 4,  name: 'BNB',         symbol: 'bnb',  image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',   current_price: 605,      price_change_percentage_24h:  1.80, price_change_percentage_7d_in_currency:  3.10, market_cap:   88000000000 },
  { id: 'solana',      market_cap_rank: 5,  name: 'Solana',      symbol: 'sol',  image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',        current_price: 178,      price_change_percentage_24h: -2.30, price_change_percentage_7d_in_currency:  5.40, market_cap:   82000000000 },
  { id: 'ripple',      market_cap_rank: 6,  name: 'XRP',         symbol: 'xrp',  image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 1.35, price_change_percentage_24h:  3.50, price_change_percentage_7d_in_currency:  6.20, market_cap:   72000000000 },
  { id: 'usd-coin',    market_cap_rank: 7,  name: 'USD Coin',    symbol: 'usdc', image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',          current_price: 1.00,     price_change_percentage_24h:  0.00, price_change_percentage_7d_in_currency:  0.00, market_cap:   33000000000 },
  { id: 'cardano',     market_cap_rank: 8,  name: 'Cardano',     symbol: 'ada',  image: null,                                                                     current_price: 0.78,     price_change_percentage_24h:  0.90, price_change_percentage_7d_in_currency:  2.40, market_cap:   27000000000 },
  { id: 'dogecoin',    market_cap_rank: 9,  name: 'Dogecoin',    symbol: 'doge', image: null,                                                                     current_price: 0.17,     price_change_percentage_24h: -0.50, price_change_percentage_7d_in_currency:  1.10, market_cap:   24000000000 },
  { id: 'chainlink',   market_cap_rank: 10, name: 'Chainlink',   symbol: 'link', image: null,                                                                     current_price: 15,       price_change_percentage_24h:  1.20, price_change_percentage_7d_in_currency:  3.70, market_cap:    9000000000 },
]

export default function Markets() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [buyCoin, setBuyCoin] = useState(null)

  async function load() {
    try {
      const data = await getTopCoins()
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CoinGecko returned no data')
      }
      setCoins(data)
      setUsingFallback(false)
    } catch (err) {
      console.error('Failed to load markets, using fallback:', err)
      setCoins(FALLBACK_TOP_COINS)
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 120000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
        Markets
      </h1>

      {usingFallback && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-400 text-sm">
          Prices may be delayed — live data from CoinGecko is temporarily unavailable.
        </div>
      )}

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
                          {coin.image ? (
                            <img
                              src={coin.image}
                              alt={coin.symbol}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-[10px] font-bold text-text-primary uppercase">
                              {(coin.symbol || '').slice(0, 3)}
                            </div>
                          )}
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
