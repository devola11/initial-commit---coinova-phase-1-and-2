import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import WalletCard from '../components/WalletCard'
import StatCard from '../components/StatCard'
import PortfolioChart from '../components/PortfolioChart'
import AllocationChart from '../components/AllocationChart'
import HoldingsTable from '../components/HoldingsTable'
import BuyModal from '../components/BuyModal'
import SellModal from '../components/SellModal'
import CoinSearch from '../components/CoinSearch'
import SavingsGoal from '../components/SavingsGoal'
import FearGreedIndex from '../components/FearGreedIndex'
import KYCBanner from '../components/KYCBanner'
import PINSetup from '../components/PINSetup'
import { TrendingWidget } from './Trending'
import { StakingWidget } from './Staking'
import { LearnWidget } from './Learn'
import { AnalyticsWidget } from './Analytics'
import { useHoldings } from '../hooks/useHoldings'
import { useWatchlist } from '../hooks/useWatchlist'
import { formatUSD, formatPercent } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import { getTopMarkets } from '../lib/coingecko'

// formatUSD stretches to 6 decimals for sub-$1 values, which looked noisy on
// the 24h-change stat (e.g. -$53.96386). Force exactly 2 dp here.
function formatUSD2dp(value) {
  const n = Number(value || 0)
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function AirdropBanner() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('coinova_airdrop_dismissed') === '1')

  useEffect(() => {
    if (!user || dismissed) return
    async function check() {
      const [{ data: airdrops }, { data: claims }] = await Promise.all([
        supabase.from('airdrops').select('id').eq('is_active', true),
        supabase.from('airdrop_claims').select('airdrop_id').eq('user_id', user.id),
      ])
      const claimedIds = new Set((claims || []).map((c) => c.airdrop_id))
      const unclaimed = (airdrops || []).filter((a) => !claimedIds.has(a.id))
      if (unclaimed.length > 0) setShow(true)
    }
    check()
  }, [user, dismissed])

  if (!show) return null

  return (
    <div className="mb-6 rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: 'linear-gradient(135deg, #0052FF 0%, #0040CC 100%)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl">&#127873;</span>
        <span className="text-white text-sm font-medium">Free crypto available! Claim your airdrops</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to="/airdrops" className="px-4 py-1.5 rounded-lg bg-white text-[#0052FF] text-xs font-semibold no-underline hover:bg-gray-100 transition-colors whitespace-nowrap">
          Claim now &#8594;
        </Link>
        <button
          onClick={() => { setShow(false); setDismissed(true); localStorage.setItem('coinova_airdrop_dismissed', '1') }}
          className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer text-lg leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

function PINPromptBanner() {
  const [show, setShow] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    const hasPIN = localStorage.getItem('coinova-pin-hash')
    const prompted = localStorage.getItem('coinova-pin-prompted')
    if (hasPIN || (prompted && Date.now() - Number(prompted) < 7 * 24 * 60 * 60 * 1000)) return
    setShow(true)
  }, [])

  if (!show) return null

  return (
    <>
      <div className="mb-6 rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#0052FF10', border: '1px solid #0052FF30' }}>
        <div className="flex items-center gap-3 min-w-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <div>
            <div className="text-white text-sm font-medium">Secure your account</div>
            <div className="text-[#8A8F98] text-xs">Set up a PIN or biometric for quick and secure access</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-1.5 rounded-lg bg-[#0052FF] text-white text-xs font-semibold border-none cursor-pointer hover:bg-[#0046D9] transition-colors whitespace-nowrap"
          >
            Set up now
          </button>
          <button
            onClick={() => { setShow(false); localStorage.setItem('coinova-pin-prompted', String(Date.now())) }}
            className="text-[#8A8F98]/60 hover:text-[#8A8F98] bg-transparent border-none cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>
      </div>
      {showSetup && (
        <PINSetup
          onComplete={() => { setShowSetup(false); setShow(false) }}
          onCancel={() => setShowSetup(false)}
        />
      )}
    </>
  )
}

function WatchlistLogo({ coinId, image, symbol }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(coinId, image)
  if (!src || err) {
    return (
      <div className="w-7 h-7 rounded-full bg-card-border flex items-center justify-center text-[9px] font-bold text-text-primary uppercase flex-shrink-0">
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)} className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0" />
}

function WatchlistWidget() {
  const { watchlist, loading } = useWatchlist()
  const [prices, setPrices] = useState({})

  useEffect(() => {
    getTopMarkets(5, 50)
      .then((data) => {
        if (!Array.isArray(data)) return
        const map = {}
        data.forEach((c) => { map[c.id] = c })
        setPrices(map)
      })
      .catch(() => {})
  }, [])

  if (loading) return null

  const items = watchlist.slice(0, 5)

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">My Watchlist</h3>
        {watchlist.length > 0 && (
          <Link to="/watchlist" className="text-primary-blue text-xs font-semibold no-underline hover:underline">
            View all
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-text-muted text-sm">Star coins in Markets to track them here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((w) => {
            const live = prices[w.coin_id]
            const price = live?.current_price
            const change = live?.price_change_percentage_24h
            return (
              <Link
                key={w.coin_id}
                to={`/coin/${w.coin_id}`}
                className="flex items-center gap-3 no-underline hover:bg-root-bg/40 rounded-lg p-1.5 -mx-1.5 transition-colors"
              >
                <WatchlistLogo coinId={w.coin_id} image={w.coin_image} symbol={w.coin_symbol} />
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary text-sm font-medium truncate">{w.coin_name}</div>
                  <div className="text-text-muted text-xs uppercase">{w.coin_symbol}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-text-primary text-sm font-medium">
                    {price != null ? formatUSD(price) : '-'}
                  </div>
                  {change != null && (
                    <div className={`text-xs font-medium ${change >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { holdings, totalValue, totalPnl, totalPnlPercent } = useHoldings()
  const [buyCoin, setBuyCoin] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [showSearch, setShowSearch] = useState(false)

  const change24h = holdings.reduce(
    (sum, h) => sum + h.currentValue * (h.change24h / 100),
    0
  )
  const change24hPct = totalValue > 0 ? (change24h / totalValue) * 100 : 0

  function handleBuyClick(coin) {
    if (coin) setBuyCoin(coin)
    else setShowSearch(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
        Dashboard
      </h1>

      <AirdropBanner />
      <KYCBanner />
      <PINPromptBanner />

      <div className="mb-6">
        <WalletCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Total Portfolio Value"
          value={formatUSD(totalValue)}
        />
        <StatCard
          label="24h Change"
          value={formatUSD2dp(change24h)}
          subtext={formatPercent(change24hPct)}
          tone={change24h >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="All-time Profit"
          value={formatUSD(totalPnl)}
          subtext={formatPercent(totalPnlPercent)}
          tone={totalPnl >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Number of Assets"
          value={holdings.length.toString()}
          subtext={holdings.length === 1 ? 'coin' : 'coins'}
        />
      </div>

      <div className="mb-6">
        <PortfolioChart />
      </div>

      <div className="mb-6">
        <AnalyticsWidget />
      </div>

      <div className="mb-6">
        <FearGreedIndex />
      </div>

      <div className="mb-6">
        <TrendingWidget />
      </div>

      <div className="mb-6">
        <StakingWidget />
      </div>

      <div className="mb-6">
        <LearnWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <AllocationChart />
        </div>
        <div className="lg:col-span-2">
          <HoldingsTable onBuy={handleBuyClick} onSell={setSellHolding} />
        </div>
      </div>

      <div className="mb-6">
        <SavingsGoal />
      </div>

      <div>
        <WatchlistWidget />
      </div>

      {showSearch && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-md bg-card-bg border border-card-border rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-text-primary font-semibold mb-3">
              Pick a coin to buy
            </div>
            <CoinSearch
              onSelect={(coin) => {
                setShowSearch(false)
                setBuyCoin(coin)
              }}
            />
          </div>
        </div>
      )}
      {buyCoin && <BuyModal coin={buyCoin} onClose={() => setBuyCoin(null)} />}
      {sellHolding && (
        <SellModal holding={sellHolding} onClose={() => setSellHolding(null)} />
      )}
    </div>
  )
}
