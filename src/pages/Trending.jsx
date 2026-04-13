import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { formatUSD } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import InvestModal from '../components/InvestModal'
import { INVEST_WALLETS } from './Invest'

const TABS = ['Trending', 'Top Gainers', 'Top Losers']

function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${Number(v).toFixed(2)}%`
}

function CoinLogo({ id, image, symbol, size = 36 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)}
    style={{ width: size, height: size }} className="rounded-full bg-white/5 flex-shrink-0" />
}

function rankColor(i) {
  if (i === 0) return '#F59E0B'
  if (i === 1) return '#8A919E'
  if (i === 2) return '#CD7F32'
  return '#1E2025'
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-[#141519] border border-[#1E2025] rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1E2025]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-[#1E2025] rounded" />
              <div className="h-3 w-16 bg-[#1E2025] rounded" />
            </div>
            <div className="h-4 w-16 bg-[#1E2025] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Trending Tab ─────────────────────────────────────────────────────── */

function TrendingTab({ coins, onInvest, navigate }) {
  if (coins.length === 0) {
    return <div className="py-16 text-center text-[#8A919E] text-sm">No trending data available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {coins.map((entry, i) => {
        const coin = entry.item || entry
        const price = coin.data?.price ?? coin.current_price
        const priceStr = typeof price === 'string'
          ? price
          : price != null ? formatUSD(price) : '—'
        const change = coin.data?.price_change_percentage_24h?.usd ?? coin.price_change_percentage_24h
        const id = coin.id
        const symbol = coin.symbol
        const name = coin.name
        const image = coin.large || coin.thumb || coin.image

        return (
          <div key={id}
            onClick={() => navigate(`/coin/${id}`)}
            className="bg-[#141519] border border-[#1E2025] hover:border-[#2C2F36] rounded-xl p-4 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: rankColor(i), color: i < 3 ? '#0A0B0D' : '#8A919E' }}>
                  {i + 1}
                </div>
                <CoinLogo id={id} image={image} symbol={symbol} size={36} />
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{name}</div>
                  <div className="text-[#8A919E] text-xs uppercase">{symbol}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white text-sm font-medium">{priceStr}</div>
                {change != null && (
                  <div className={`text-xs font-medium ${change >= 0 ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                    {fmtPct(change)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#0052FF]/20 text-[#0052FF]">Trending</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onInvest({ id, name, symbol, image, current_price: typeof price === 'number' ? price : null })
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-xs font-semibold border-none cursor-pointer transition-colors">
                  Invest
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Gainers / Losers Tab ─────────────────────────────────────────────── */

function MoversTab({ coins, type, onInvest, navigate }) {
  if (coins.length === 0) {
    return <div className="py-16 text-center text-[#8A919E] text-sm">No data available</div>
  }

  const isGainer = type === 'gainers'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {coins.map((coin) => {
        const change = coin.price_change_percentage_24h
        return (
          <div key={coin.id}
            onClick={() => navigate(`/coin/${coin.id}`)}
            className="bg-[#141519] border border-[#1E2025] hover:border-[#2C2F36] rounded-xl p-4 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{coin.name}</div>
                <div className="text-[#8A919E] text-xs uppercase">{coin.symbol}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-white text-sm font-medium">{formatUSD(coin.current_price)}</div>
                <div className={`text-lg font-bold ${isGainer ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                  {fmtPct(change)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onInvest(coin)
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-xs font-semibold border-none cursor-pointer transition-colors flex-shrink-0 ml-2">
                Invest
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Recently Added ───────────────────────────────────────────────────── */

function RecentlyAdded() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/markets?per_page=10&page=1')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Show last 10 by market cap (smallest = most recently notable)
          const sorted = [...data].sort((a, b) => (b.market_cap_rank || 999) - (a.market_cap_rank || 999))
          setCoins(sorted.slice(0, 10))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6 animate-pulse">
        <div className="h-4 w-40 bg-[#1E2025] rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-full bg-[#1E2025]" />
            <div className="flex-1 h-4 bg-[#1E2025] rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Recently Added</h3>
      <div className="divide-y divide-[#1E2025]">
        {coins.map((coin) => (
          <div key={coin.id}
            onClick={() => navigate(`/coin/${coin.id}`)}
            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-[#0A0B0D]/50 -mx-2 px-2 rounded-lg transition-colors">
            <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{coin.name}</div>
              <div className="text-[#8A919E] text-xs uppercase">{coin.symbol}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#05B169]/15 text-[#05B169] text-[10px] font-semibold flex-shrink-0">New</span>
            <div className="text-white text-sm font-medium flex-shrink-0">{formatUSD(coin.current_price)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────────────── */

export default function Trending() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Trending')
  const [data, setData] = useState({ trending: [], gainers: [], losers: [] })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [investCoin, setInvestCoin] = useState(null)

  function load() {
    setLoading(true)
    fetch('/api/trending', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((json) => {
        setData({
          trending: json.trending || [],
          gainers: json.gainers || [],
          losers: json.losers || [],
        })
        setLastUpdated(new Date())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const tabIcons = { 'Trending': '\uD83D\uDD25', 'Top Gainers': '\uD83D\uDCC8', 'Top Losers': '\uD83D\uDCC9' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Trending</h1>
          <p className="text-text-muted text-sm mt-1">What's hot in crypto right now</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[#5B616E] text-xs">
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={load}
            className="p-2 rounded-lg bg-[#141519] border border-[#1E2025] hover:border-[#2C2F36] text-[#8A919E] hover:text-white border-none bg-transparent cursor-pointer transition-colors"
            title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 my-5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-none cursor-pointer transition-colors ${
              tab === t
                ? 'bg-[#0052FF] text-white'
                : 'bg-[#141519] text-[#8A919E] hover:text-white'
            }`}>
            {tabIcons[t]} {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          {tab === 'Trending' && (
            <TrendingTab coins={data.trending} onInvest={setInvestCoin} navigate={navigate} />
          )}
          {tab === 'Top Gainers' && (
            <MoversTab coins={data.gainers} type="gainers" onInvest={setInvestCoin} navigate={navigate} />
          )}
          {tab === 'Top Losers' && (
            <MoversTab coins={data.losers} type="losers" onInvest={setInvestCoin} navigate={navigate} />
          )}
        </>
      )}

      {/* Recently Added */}
      <div className="mt-10">
        <RecentlyAdded />
      </div>

      {investCoin && (
        <InvestModal coin={investCoin} wallets={INVEST_WALLETS} onClose={() => setInvestCoin(null)} />
      )}
    </div>
  )
}

/* ── Exported widget for Dashboard ────────────────────────────────────── */

export function TrendingWidget() {
  const navigate = useNavigate()
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trending', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((json) => {
        const items = (json.trending || []).slice(0, 7).map((entry) => {
          const c = entry.item || entry
          return {
            id: c.id,
            name: c.name,
            symbol: c.symbol,
            image: c.large || c.thumb || c.image,
            price: c.data?.price,
            change: c.data?.price_change_percentage_24h?.usd,
          }
        })
        setCoins(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (coins.length === 0) return null

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">{'\uD83D\uDD25'} Trending Now</h3>
        <Link to="/trending" className="text-primary-blue text-xs font-semibold no-underline hover:underline">
          View all trending
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {coins.map((coin) => (
          <div key={coin.id}
            onClick={() => navigate(`/coin/${coin.id}`)}
            className="flex-shrink-0 w-[140px] bg-[#0A0B0D] rounded-xl p-3 cursor-pointer hover:bg-[#1a1d23] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={24} />
              <span className="text-white text-xs font-semibold uppercase truncate">{coin.symbol}</span>
            </div>
            <div className="text-white text-sm font-medium">
              {typeof coin.price === 'string' ? coin.price : coin.price != null ? formatUSD(coin.price) : '—'}
            </div>
            {coin.change != null && (
              <div className={`text-xs font-medium mt-0.5 ${coin.change >= 0 ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                {fmtPct(coin.change)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Exported banner for Markets page ─────────────────────────────────── */

export function TrendingBanner() {
  const navigate = useNavigate()
  const [coins, setCoins] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/trending', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((json) => {
        const items = (json.trending || []).slice(0, 3).map((entry) => {
          const c = entry.item || entry
          return {
            id: c.id,
            symbol: c.symbol,
            change: c.data?.price_change_percentage_24h?.usd,
          }
        })
        setCoins(items)
      })
      .catch(() => {})
  }, [])

  if (dismissed || coins.length === 0) return null

  return (
    <div className="mb-4 flex items-center gap-2 bg-[#141519] border border-[#1E2025] rounded-xl px-4 py-3 overflow-x-auto">
      <span className="text-sm flex-shrink-0">{'\uD83D\uDD25'}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
        {coins.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <span className="text-[#2C2F36] mx-1">|</span>}
            <button
              onClick={() => navigate(`/coin/${c.id}`)}
              className="text-white text-sm font-medium bg-transparent border-none cursor-pointer hover:text-[#0052FF] transition-colors uppercase">
              {c.symbol}
            </button>
            {c.change != null && (
              <span className={`text-xs font-medium ${c.change >= 0 ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
                {fmtPct(c.change)}
              </span>
            )}
          </span>
        ))}
      </div>
      <button onClick={() => setDismissed(true)}
        className="text-[#5B616E] hover:text-white bg-transparent border-none cursor-pointer text-sm leading-none flex-shrink-0 ml-2">
        &times;
      </button>
    </div>
  )
}
