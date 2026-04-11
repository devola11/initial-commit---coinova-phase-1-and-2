import { useState } from 'react'
import WalletCard from '../components/WalletCard'
import StatCard from '../components/StatCard'
import PortfolioChart from '../components/PortfolioChart'
import AllocationChart from '../components/AllocationChart'
import HoldingsTable from '../components/HoldingsTable'
import BuyModal from '../components/BuyModal'
import SellModal from '../components/SellModal'
import CoinSearch from '../components/CoinSearch'
import SavingsGoal from '../components/SavingsGoal'
import { useHoldings } from '../hooks/useHoldings'
import { formatUSD, formatPercent } from '../utils/formatters'

// formatUSD stretches to 6 decimals for sub-$1 values, which looked noisy on
// the 24h-change stat (e.g. -$53.96386). Force exactly 2 dp here.
function formatUSD2dp(value) {
  const n = Number(value || 0)
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
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

      <div className="mb-6">
        <WalletCard />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <AllocationChart />
        </div>
        <div className="lg:col-span-2">
          <HoldingsTable onBuy={handleBuyClick} onSell={setSellHolding} />
        </div>
      </div>

      <div>
        <SavingsGoal />
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
