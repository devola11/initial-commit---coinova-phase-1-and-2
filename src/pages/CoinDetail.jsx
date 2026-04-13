import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatUSD, formatNumber } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import InvestModal from '../components/InvestModal'
import BuyModal from '../components/BuyModal'
import { INVEST_WALLETS } from './Invest'
import { useWatchlist } from '../hooks/useWatchlist'

function WatchlistStarIcon({ filled }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : '#8A919E'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="hover:stroke-[#F59E0B] transition-colors"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

const TIME_FILTERS = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 'max' },
]

const TABS = ['Overview', 'Stats', 'News', 'About']

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

function CoinLogo({ id, image, symbol, size = 48 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-white text-sm font-bold uppercase"
      >
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={symbol}
      onError={() => setErr(true)}
      style={{ width: size, height: size }}
      className="rounded-full bg-white/5"
    />
  )
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtChartDate(ts, days) {
  const d = new Date(ts)
  if (days <= 1) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (days <= 30) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function ProgressBar({ value, max, color = 'bg-[#0052FF]' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-2 rounded-full bg-[#1E2025]">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E2025] last:border-b-0">
      <span className="text-[#8A8F98] text-sm">{label}</span>
      <div className="text-right">
        <span className="text-white text-sm font-medium">{value}</span>
        {sub && <div className="text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, days }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1E2025] border border-[#2A2D35] rounded-lg px-3 py-2 text-xs">
      <div className="text-white font-semibold">{formatUSD(d.price)}</div>
      <div className="text-[#8A8F98]">{fmtChartDate(d.time, days)}</div>
    </div>
  )
}

/* ── Overview Tab ─────────────────────────────────────────────────────── */
function OverviewTab({ coinId, detail, onInvest, onBuy }) {
  const [chartData, setChartData] = useState([])
  const [days, setDays] = useState(7)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setChartLoading(true)
    fetchJson(`/api/history?id=${coinId}&days=${days}`)
      .then((data) => {
        if (cancelled) return
        const prices = (data.prices || []).map(([time, price]) => ({ time, price }))
        setChartData(prices)
      })
      .catch(() => !cancelled && setChartData([]))
      .finally(() => !cancelled && setChartLoading(false))
    return () => { cancelled = true }
  }, [coinId, days])

  const md = detail?.market_data
  const price = md?.current_price?.usd
  const change24h = md?.price_change_percentage_24h
  const changePositive = (change24h ?? 0) >= 0

  return (
    <div className="space-y-6">
      {/* Price header */}
      <div>
        <div className="text-white text-3xl font-bold">
          {price != null ? formatUSD(price) : '—'}
        </div>
        {change24h != null && (
          <span className={`text-sm font-semibold ${changePositive ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
            {changePositive ? '+' : ''}{change24h.toFixed(2)}% (24h)
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setDays(f.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                days === f.days
                  ? 'bg-[#0052FF] text-white'
                  : 'bg-[#1E2025] text-[#8A8F98] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {chartLoading ? (
          <div className="h-[300px] flex items-center justify-center text-[#8A8F98] text-sm">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-[#8A8F98] text-sm">
            No chart data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tickFormatter={(t) => fmtChartDate(t, days)}
                tick={{ fill: '#8A8F98', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => formatUSD(v)}
                tick={{ fill: '#8A8F98', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<ChartTooltip days={days} />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0052FF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#0052FF' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onInvest}
          className="flex-1 py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors"
        >
          Invest
        </button>
        <button
          onClick={onBuy}
          className="flex-1 py-3 rounded-lg bg-[#141519] border border-[#1E2025] hover:border-[#0052FF] text-white text-sm font-semibold cursor-pointer transition-colors"
        >
          Buy
        </button>
      </div>
    </div>
  )
}

/* ── Stats Tab ────────────────────────────────────────────────────────── */
function StatsTab({ detail }) {
  const md = detail?.market_data
  if (!md) return <div className="text-[#8A8F98] text-sm py-10 text-center">Loading stats...</div>

  const price = md.current_price?.usd || 0
  const low24 = md.low_24h?.usd
  const high24 = md.high_24h?.usd
  const ath = md.ath?.usd
  const athDate = md.ath_date?.usd
  const athChange = md.ath_change_percentage?.usd
  const atl = md.atl?.usd
  const atlDate = md.atl_date?.usd
  const atlChange = md.atl_change_percentage?.usd
  const circ = md.circulating_supply
  const total = md.total_supply
  const max = md.max_supply
  const tvl = md.total_value_locked?.usd

  return (
    <div className="space-y-6">
      {/* Price Performance */}
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Price Performance</h3>
        {low24 != null && high24 != null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8A8F98]">24h Low: {formatUSD(low24)}</span>
              <span className="text-[#8A8F98]">24h High: {formatUSD(high24)}</span>
            </div>
            <ProgressBar value={price - low24} max={high24 - low24} />
          </div>
        )}
        {ath != null && (
          <StatRow
            label="All Time High"
            value={formatUSD(ath)}
            sub={
              <span>
                <span className="text-[#F6465D]">{athChange?.toFixed(2)}%</span>
                {athDate && <span className="text-[#8A8F98] ml-1">({fmtDate(athDate)})</span>}
              </span>
            }
          />
        )}
        {atl != null && (
          <StatRow
            label="All Time Low"
            value={formatUSD(atl)}
            sub={
              <span>
                <span className="text-[#05B169]">+{atlChange?.toFixed(2)}%</span>
                {atlDate && <span className="text-[#8A8F98] ml-1">({fmtDate(atlDate)})</span>}
              </span>
            }
          />
        )}
      </div>

      {/* Market Metrics */}
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Market Metrics</h3>
        <StatRow label="Market Cap Rank" value={md.market_cap_rank ? `#${md.market_cap_rank}` : '—'} />
        <StatRow label="Market Cap" value={md.market_cap?.usd ? `$${formatNumber(md.market_cap.usd)}` : '—'} />
        <StatRow label="Fully Diluted Valuation" value={md.fully_diluted_valuation?.usd ? `$${formatNumber(md.fully_diluted_valuation.usd)}` : '—'} />
        {tvl != null && <StatRow label="Total Value Locked" value={`$${formatNumber(tvl)}`} />}
        {tvl != null && md.market_cap?.usd && (
          <StatRow label="Market Cap / TVL" value={(md.market_cap.usd / tvl).toFixed(2)} />
        )}
        <StatRow label="Total Volume (24h)" value={md.total_volume?.usd ? `$${formatNumber(md.total_volume.usd)}` : '—'} />
      </div>

      {/* Supply Metrics */}
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Supply Metrics</h3>
        <StatRow label="Circulating Supply" value={circ ? formatNumber(circ, 0) : '—'} />
        <StatRow label="Total Supply" value={total ? formatNumber(total, 0) : '—'} />
        <StatRow label="Max Supply" value={max ? formatNumber(max, 0) : '—'} />
        {max && circ && (
          <div className="pt-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8A8F98]">% of Max Supply</span>
              <span className="text-white">{((circ / max) * 100).toFixed(1)}%</span>
            </div>
            <ProgressBar value={circ} max={max} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── News Tab ─────────────────────────────────────────────────────────── */
function NewsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#141519] border border-[#1E2025] rounded-xl p-3.5 animate-pulse">
          <div className="h-4 w-3/4 bg-[#1E2025] rounded mb-2" />
          <div className="h-3 w-1/2 bg-[#1E2025] rounded mb-3" />
          <div className="h-3 w-1/3 bg-[#1E2025] rounded" />
        </div>
      ))}
    </div>
  )
}

function NewsTab({ coinName, coinSymbol }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchJson(
      `/api/news?symbol=${encodeURIComponent(coinSymbol || '')}&name=${encodeURIComponent(coinName || '')}`
    )
      .then((data) => {
        if (!cancelled) setArticles(Array.isArray(data) ? data : [])
      })
      .catch(() => !cancelled && setArticles([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [coinName, coinSymbol])

  if (loading) return <NewsSkeleton />
  if (articles.length === 0) {
    return (
      <div className="text-[#8A8F98] text-sm py-10 text-center">
        No recent news for {coinName}.
      </div>
    )
  }

  const hasGeneral = articles.some((a) => a.matched === false)

  return (
    <div className="space-y-3">
      {hasGeneral && (
        <div className="flex items-center gap-2 px-1 mb-1">
          <span className="px-2.5 py-1 rounded-full bg-[#0052FF]/10 text-[#0052FF] text-[11px] font-semibold">
            General crypto news
          </span>
          <span className="text-[#8A8F98] text-xs">
            No {coinName}-specific articles found right now
          </span>
        </div>
      )}
      {articles.filter((a) => a.link).map((a, i) => {
        let dateStr = null
        if (a.pubDate) {
          try {
            dateStr = new Date(a.pubDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          } catch (e) {
            dateStr = null
          }
        }

        return (
          <a
            key={i}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 bg-[#141519] border border-[#1E2025] rounded-xl p-3.5 hover:border-[#2C2F36] transition-colors no-underline"
          >
            <div className="min-w-0 flex-1">
              <div className="text-white text-sm font-semibold mb-1 leading-snug">
                {a.title}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8A8F98]">
                {a.source && <span>{a.source}</span>}
                {a.source && dateStr && <span>-</span>}
                {dateStr && <span>{dateStr}</span>}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8F98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </a>
        )
      })}
    </div>
  )
}

/* ── About Tab ────────────────────────────────────────────────────────── */
function AboutTab({ detail }) {
  const [expanded, setExpanded] = useState(false)

  const desc = detail?.description?.en || ''
  const tags = detail?.categories?.filter(Boolean) || []
  const website = detail?.links?.homepage?.find((u) => u) || null
  const genesis = detail?.genesis_date

  const cleanDesc = desc.replace(/<[^>]+>/g, '')
  const isLong = cleanDesc.length > 400
  const displayDesc = isLong && !expanded ? cleanDesc.slice(0, 400) + '...' : cleanDesc

  if (!detail) return <div className="text-[#8A8F98] text-sm py-10 text-center">Loading...</div>

  return (
    <div className="space-y-6">
      {cleanDesc && (
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Description</h3>
          <p className="text-[#8A8F98] text-sm leading-relaxed whitespace-pre-line">{displayDesc}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[#0052FF] text-xs font-semibold bg-transparent border-none cursor-pointer"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-[#0052FF]/10 text-[#0052FF] text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm mb-1">Info</h3>
        {website && (
          <div className="flex items-center justify-between py-2 border-b border-[#1E2025]">
            <span className="text-[#8A8F98] text-sm">Website</span>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0052FF] text-sm font-medium no-underline hover:underline flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {new URL(website).hostname}
            </a>
          </div>
        )}
        {genesis && (
          <div className="flex items-center justify-between py-2">
            <span className="text-[#8A8F98] text-sm">Genesis Date</span>
            <span className="text-white text-sm font-medium">{fmtDate(genesis)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main CoinDetail page ─────────────────────────────────────────────── */
export default function CoinDetail() {
  const { coinId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [showInvest, setShowInvest] = useState(false)
  const [showBuy, setShowBuy] = useState(false)
  const { isWatched, toggle } = useWatchlist()
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchJson(`/api/coindetail?id=${coinId}`)
      .then((data) => !cancelled && setDetail(data))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [coinId])

  const coin = useMemo(() => {
    if (!detail) return null
    return {
      id: detail.id,
      name: detail.name,
      symbol: detail.symbol,
      image: detail.image?.large || detail.image?.small || null,
      current_price: detail.market_data?.current_price?.usd || null,
    }
  }, [detail])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-24 bg-[#1E2025] rounded" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1E2025]" />
            <div className="h-8 w-48 bg-[#1E2025] rounded" />
          </div>
          <div className="h-[400px] bg-[#1E2025] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!detail || !detail.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-[#8A8F98] text-sm py-20">Coin not found.</div>
        <button
          onClick={() => navigate('/markets')}
          className="text-[#0052FF] text-sm font-semibold bg-transparent border-none cursor-pointer"
        >
          Back to Markets
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/markets')}
        className="flex items-center gap-2 text-[#8A8F98] hover:text-white text-sm font-medium bg-transparent border-none cursor-pointer mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Markets
      </button>

      {/* Coin header */}
      <div className="flex items-center gap-4 mb-6">
        <CoinLogo
          id={detail.id}
          image={detail.image?.large || detail.image?.small}
          symbol={detail.symbol}
          size={48}
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl font-bold">{detail.name}</h1>
            <button
              onClick={async () => {
                const added = await toggle({
                  id: detail.id,
                  symbol: detail.symbol,
                  name: detail.name,
                  image: detail.image?.large || detail.image?.small || null,
                })
                setToast(added ? 'Added to watchlist' : 'Removed from watchlist')
                setTimeout(() => setToast(''), 2500)
              }}
              className="bg-transparent border-none cursor-pointer p-1 hover:scale-110 transition-transform"
              title={isWatched(detail.id) ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <WatchlistStarIcon filled={isWatched(detail.id)} />
            </button>
          </div>
          <span className="text-[#8A8F98] text-sm uppercase">{detail.symbol}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors ${
              tab === t
                ? 'bg-[#0052FF] text-white'
                : 'bg-[#141519] text-[#8A8F98] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <OverviewTab
          coinId={coinId}
          detail={detail}
          onInvest={() => setShowInvest(true)}
          onBuy={() => setShowBuy(true)}
        />
      )}
      {tab === 'Stats' && <StatsTab detail={detail} />}
      {tab === 'News' && <NewsTab coinName={detail.name} coinSymbol={detail.symbol} />}
      {tab === 'About' && <AboutTab detail={detail} />}

      {/* Modals */}
      {showInvest && coin && (
        <InvestModal
          coin={coin}
          wallets={INVEST_WALLETS}
          onClose={() => setShowInvest(false)}
        />
      )}
      {showBuy && coin && (
        <BuyModal coin={coin} onClose={() => setShowBuy(false)} />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#141519] border border-[#1E2025] rounded-xl px-5 py-3 text-white text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
