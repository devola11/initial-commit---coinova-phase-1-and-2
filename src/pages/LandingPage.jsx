import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatUSD, formatPercent } from '../utils/formatters'

const FLOATING_COINS = [
  { id: 'bitcoin', symbol: 'BTC', color: '#F7931A', img: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', color: '#627EEA', img: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana', symbol: 'SOL', color: '#14F195', img: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'ripple', symbol: 'XRP', color: '#8A919E', img: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'binancecoin', symbol: 'BNB', color: '#F3BA2F', img: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'usd-coin', symbol: 'USDC', color: '#2775CA', img: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png' },
]

const FALLBACK_COINS = [
  { id: 'bitcoin',     name: 'Bitcoin',  symbol: 'btc',  image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',          current_price: 72000,   price_change_percentage_24h: 2.14 },
  { id: 'ethereum',    name: 'Ethereum', symbol: 'eth',  image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',       current_price: 2200,    price_change_percentage_24h: -1.20 },
  { id: 'tether',      name: 'Tether',   symbol: 'usdt', image: null,                                                                     current_price: 1.00,    price_change_percentage_24h: 0.01 },
  { id: 'ripple',      name: 'XRP',      symbol: 'xrp',  image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 1.35, price_change_percentage_24h: 3.50 },
  { id: 'binancecoin', name: 'BNB',      symbol: 'bnb',  image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',   current_price: 605,     price_change_percentage_24h: 1.80 },
  { id: 'solana',      name: 'Solana',   symbol: 'sol',  image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',        current_price: 178,     price_change_percentage_24h: -2.30 },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [coins, setCoins] = useState([])
  const [loadingCoins, setLoadingCoins] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1'
        )
        if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('CoinGecko returned no data')
        }
        if (!cancelled) setCoins(data)
      } catch (err) {
        console.error('Failed to load prices, using fallback data', err)
        if (!cancelled) setCoins(FALLBACK_COINS)
      } finally {
        if (!cancelled) setLoadingCoins(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function handleGetStarted(e) {
    e.preventDefault()
    const suffix = email ? `?email=${encodeURIComponent(email)}` : ''
    navigate(`/register${suffix}`)
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-full" style={{ backgroundColor: '#0052FF' }} />
              <span className="text-xl font-extrabold text-black tracking-tight">Coinova</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 rounded-full transition-colors no-underline"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-colors no-underline"
                style={{ backgroundColor: '#0052FF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0040CC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0052FF')}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to offset fixed navbar (h-16 = 64px) */}
      <div aria-hidden="true" className="h-16" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-3xl">
          <h1 className="text-[32px] sm:text-5xl lg:text-[56px] leading-[1.05] font-extrabold text-black tracking-tight">
            Take control of your crypto.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed">
            Buy, sell and track crypto with one trusted account. Start with $10,000 in demo funds.
          </p>

          <form onSubmit={handleGetStarted} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-4 rounded-full border border-gray-200 bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              className="px-7 py-4 rounded-full text-sm font-semibold text-white transition-colors border-none cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: '#0052FF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0040CC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0052FF')}
            >
              Get started
            </button>
          </form>
        </div>

        {/* Floating coins */}
        <div className="mt-20 flex flex-wrap gap-4 sm:gap-6 justify-start items-center">
          {FLOATING_COINS.map((coin, idx) => (
            <div
              key={coin.id}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center"
              style={{
                transform: `translateY(${(idx % 2) * -8}px)`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              }}
            >
              <img src={coin.img} alt={coin.symbol} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Live prices */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl p-6 sm:p-10" style={{ backgroundColor: '#0A0B0D' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore crypto prices
            </h2>
            <Link
              to="/markets"
              className="hidden sm:inline-block px-5 py-2.5 rounded-full text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors no-underline"
            >
              See all assets
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loadingCoins
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl animate-pulse"
                    style={{ backgroundColor: '#141519' }}
                  />
                ))
              : coins.map((coin) => {
                  const change = coin.price_change_percentage_24h ?? 0
                  const positive = change >= 0
                  return (
                    <div
                      key={coin.id}
                      className="flex items-center justify-between rounded-xl p-4 border transition-colors"
                      style={{
                        backgroundColor: '#141519',
                        borderColor: '#1E2025',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {coin.image ? (
                          <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full flex-shrink-0" />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: '#26A17B' }}
                          >
                            {(coin.symbol || '').slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{coin.name}</div>
                          <div className="text-xs uppercase" style={{ color: '#8A919E' }}>{coin.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">{formatUSD(coin.current_price)}</div>
                        <div
                          className="text-xs font-medium"
                          style={{ color: positive ? '#05B169' : '#F6465D' }}
                        >
                          {formatPercent(change)}
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>

          <div className="mt-6 sm:hidden">
            <Link
              to="/markets"
              className="block text-center w-full px-5 py-3 rounded-full text-sm font-semibold text-white border border-white/20 no-underline"
            >
              See all assets
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Buy & sell instantly',
              body: 'Trade at live CoinGecko prices with demo wallet funds. No slippage, no delays.',
            },
            {
              title: 'Track your portfolio',
              body: 'Real-time P&L, allocation charts, and performance history across every coin.',
            },
            {
              title: 'Set price alerts',
              body: 'Get notified the moment any coin hits your target price — above or below.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-8 rounded-2xl bg-white border border-gray-100"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
            >
              <h3 className="text-xl font-extrabold text-black tracking-tight">{f.title}</h3>
              <p className="mt-3 text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blue CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-2xl p-10 sm:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
          style={{ backgroundColor: '#0052FF' }}
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Start trading in minutes.
            </h2>
            <p className="mt-3 text-white/80 text-lg">
              Join Coinova free and get $10,000 in demo funds.
            </p>
          </div>
          <Link
            to="/register"
            className="px-8 py-4 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors no-underline whitespace-nowrap"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#F8F9FA' }} className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-full" style={{ backgroundColor: '#0052FF' }} />
              <span className="text-lg font-extrabold text-black tracking-tight">Coinova</span>
            </Link>
            <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-600">
              <Link to="/markets" className="hover:text-black no-underline text-gray-600">Markets</Link>
              <Link to="/portfolio" className="hover:text-black no-underline text-gray-600">Portfolio</Link>
              <Link to="/alerts" className="hover:text-black no-underline text-gray-600">Alerts</Link>
              <Link to="/login" className="hover:text-black no-underline text-gray-600">Sign in</Link>
            </div>
            <div className="text-sm text-gray-500">© 2026 Coinova</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
