import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatUSD, formatPercent } from '../utils/formatters'
import GlobalPreferences, { useGlobalPrefs } from '../components/GlobalPreferences'
import logo from '../assets/logo.jpeg'
import hero1 from '../assets/hero1.avif'
import hero2 from '../assets/hero2.avif'

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
  const [prefsOpen, setPrefsOpen] = useState(false)
  const prefs = useGlobalPrefs()
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
        if (!Array.isArray(data) || data.length === 0) throw new Error('No data')
        if (!cancelled) setCoins(data)
      } catch {
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
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <img src={logo} alt="Coinova" className="h-8 rounded" />
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
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-full no-underline"
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

      <div aria-hidden="true" className="h-16" />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: '#EBF0FF', color: '#0052FF' }}
            >
              The future of crypto is here
            </span>
            <h1 className="text-[36px] sm:text-5xl lg:text-[56px] leading-[1.05] font-extrabold text-black tracking-tight">
              Trade crypto.<br />Build wealth.
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
              Buy, sell and invest in 250+ cryptocurrencies with one trusted account. Start with $10,000 in demo funds.
            </p>

            <form onSubmit={handleGetStarted} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-full border border-gray-200 bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="submit"
                className="px-7 py-4 rounded-full text-sm font-semibold text-white border-none cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: '#0052FF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0040CC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0052FF')}
              >
                Get started
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-6">
              {['250+ Coins', 'Live Prices', 'Secure Platform'].map((badge) => (
                <div key={badge} className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0052FF' }} />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Right column — hero image */}
          <div className="relative flex justify-center lg:justify-end">
            <img
              src={hero1}
              alt="Coinova trading platform"
              className="w-full max-w-lg rounded-2xl"
              style={{ animation: 'heroFloat 4s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* Float animation */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      {/* ── Live Prices ────────────────────────────────────────────── */}
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
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#141519' }} />
                ))
              : coins.map((coin) => {
                  const change = coin.price_change_percentage_24h ?? 0
                  const positive = change >= 0
                  return (
                    <div
                      key={coin.id}
                      className="flex items-center justify-between rounded-xl p-4 border transition-colors"
                      style={{ backgroundColor: '#141519', borderColor: '#1E2025' }}
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
                        <div className="text-xs font-medium" style={{ color: positive ? '#05B169' : '#F6465D' }}>
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

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: '#EBF0FF' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3 className="text-xl font-extrabold text-black tracking-tight">Buy & sell instantly</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">Trade at live prices with zero delays. Execute orders in milliseconds.</p>
          </div>

          {/* Card 2 — with Hero2 illustration */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <img src={hero2} alt="Portfolio tracking" className="w-full rounded-xl mb-5 object-cover" style={{ maxHeight: '160px' }} />
            <h3 className="text-xl font-extrabold text-black tracking-tight">Track your portfolio</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">Real-time P&L and performance charts across every coin you hold.</p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: '#EBF0FF' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h3 className="text-xl font-extrabold text-black tracking-tight">Set price alerts</h3>
            <p className="mt-3 text-gray-500 leading-relaxed">Never miss a price movement. Get notified the moment any coin hits your target.</p>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl py-10 px-6 sm:px-10" style={{ backgroundColor: '#0052FF' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/20">
            {[
              ['250+', 'Cryptocurrencies'],
              ['Live', 'Market Data'],
              ['$10,000', 'Demo Funds'],
              ['24/7', 'Trading'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{num}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center py-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Start trading in minutes.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Join free and get $10,000 in demo funds.
          </p>
          <Link
            to="/register"
            className="inline-block mt-8 px-8 py-4 rounded-full text-sm font-semibold text-white no-underline"
            style={{ backgroundColor: '#0052FF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0040CC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0052FF')}
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#F8F9FA' }} className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col gap-3">
              <Link to="/" className="flex items-center gap-2 no-underline">
                <img src={logo} alt="Coinova" className="h-7 rounded" />
                <span className="text-lg font-extrabold text-black tracking-tight">Coinova</span>
              </Link>
              <button
                onClick={() => setPrefsOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-black bg-transparent border-none cursor-pointer transition-colors p-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {prefs.country} &middot; {prefs.language}
              </button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-600">
              <Link to="/markets" className="hover:text-black no-underline text-gray-600">Markets</Link>
              <Link to="/portfolio" className="hover:text-black no-underline text-gray-600">Portfolio</Link>
              <Link to="/alerts" className="hover:text-black no-underline text-gray-600">Alerts</Link>
              <Link to="/login" className="hover:text-black no-underline text-gray-600">Sign in</Link>
            </div>
            <div className="text-sm text-gray-500">&copy; 2026 Coinova</div>
          </div>
        </div>
      </footer>

      {prefsOpen && (
        <GlobalPreferences
          onClose={() => setPrefsOpen(false)}
          country={prefs.country}
          language={prefs.language}
          setCountry={prefs.setCountry}
          setLanguage={prefs.setLanguage}
        />
      )}
    </div>
  )
}
