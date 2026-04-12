import { useEffect, useMemo, useState } from 'react'
import { getTopMarkets } from '../lib/coingecko'
import { getCoinImageUrl } from '../utils/coinImages'
import { formatUSD } from '../utils/formatters'
import {
  CATEGORY_TABS,
  filterByCategory,
  filterBySearch,
} from '../utils/coinCategories'
import InvestModal from '../components/InvestModal'

// Treasury addresses — hardcoded. BTC and ETH have their own wallets; all
// other coins (memes, alts, DeFi, L2, AI, stables) settle via USDT TRC-20 so
// deposits consolidate on one chain for treasury ops.
export const INVEST_WALLETS = {
  btc: {
    address: 'bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl',
    label: 'BTC',
    network: 'Bitcoin (BTC)',
    warning: 'Send Bitcoin (BTC) to this address to invest',
  },
  eth: {
    address: '0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458',
    label: 'ETH',
    network: 'Ethereum (ERC-20)',
    warning: 'Send Ethereum (ETH) to this address to invest',
  },
  usdt_trc20: {
    address: 'TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca',
    label: 'USDT TRC-20',
    network: 'Tron (TRC-20)',
    warning: null,
  },
}

function ChangePill({ value }) {
  if (value == null) return <span className="text-text-muted text-xs">—</span>
  const positive = value >= 0
  return (
    <span
      className={`text-xs font-semibold ${positive ? 'text-profit' : 'text-loss'}`}
    >
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

function CoinCard({ coin, onInvest }) {
  const [imgErr, setImgErr] = useState(false)
  const logo = getCoinImageUrl(coin.id, coin.image)
  const price = coin.current_price
  const change = coin.price_change_percentage_24h

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {logo && !imgErr ? (
          <img
            src={logo}
            alt={coin.symbol}
            onError={() => setImgErr(true)}
            className="w-10 h-10 rounded-full bg-white/5"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-blue/30 flex items-center justify-center text-white text-xs font-bold">
            {(coin.symbol || '').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-text-primary font-semibold truncate">
            {coin.name}
          </div>
          <div className="text-text-muted text-xs uppercase">{coin.symbol}</div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
            Price
          </div>
          <div className="text-text-primary text-base font-semibold">
            {price != null ? formatUSD(price) : '—'}
          </div>
        </div>
        <ChangePill value={change} />
      </div>

      <button
        onClick={() => onInvest(coin)}
        className="w-full py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
      >
        Invest
      </button>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-card-border" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-card-border rounded mb-2" />
          <div className="h-2 w-10 bg-card-border rounded" />
        </div>
      </div>
      <div className="h-4 w-20 bg-card-border rounded mb-3" />
      <div className="h-9 w-full bg-card-border rounded" />
    </div>
  )
}

export default function Invest() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    try {
      const data = await getTopMarkets(5, 50)
      if (Array.isArray(data) && data.length > 0) setCoins(data)
    } catch (err) {
      console.error('Invest load failed:', err)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Invest
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Fund your Coinova account by sending crypto. Your balance is credited
          within 24 hours after we verify your transaction.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or symbol..."
          className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : visibleCoins.length === 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-10 text-center text-text-muted text-sm">
          No coins match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCoins.map((coin) => (
            <CoinCard key={coin.id} coin={coin} onInvest={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <InvestModal
          coin={selected}
          wallets={INVEST_WALLETS}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
