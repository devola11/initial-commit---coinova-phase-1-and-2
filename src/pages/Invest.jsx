import { useEffect, useMemo, useState } from 'react'
import { getCoinsByIds } from '../lib/coingecko'
import { getCoinImageUrl } from '../utils/coinImages'
import { formatUSD } from '../utils/formatters'
import InvestModal from '../components/InvestModal'

// Hardcoded catalog of coins the user can invest in. Each entry carries its
// payment network so InvestModal knows which wallet address to display.
// `wallet_used` matches the investment_requests.wallet_used column.
export const INVEST_COINS = {
  major: [
    { id: 'bitcoin',  symbol: 'BTC', name: 'Bitcoin',  wallet_used: 'btc' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', wallet_used: 'eth' },
  ],
  meme: [
    { id: 'shiba-inu',     symbol: 'SHIB',     name: 'Shiba Inu',     wallet_used: 'usdt_trc20' },
    { id: 'pepe',          symbol: 'PEPE',     name: 'Pepe',          wallet_used: 'usdt_trc20' },
    { id: 'dogecoin',      symbol: 'DOGE',     name: 'Dogecoin',      wallet_used: 'usdt_trc20' },
    { id: 'floki',         symbol: 'FLOKI',    name: 'Floki',         wallet_used: 'usdt_trc20' },
    { id: 'baby-doge-coin',symbol: 'BABYDOGE', name: 'Baby Doge Coin',wallet_used: 'usdt_trc20' },
    { id: 'bonk',          symbol: 'BONK',     name: 'Bonk',          wallet_used: 'usdt_trc20' },
    { id: 'wojak',         symbol: 'WOJAK',    name: 'Wojak',         wallet_used: 'usdt_trc20' },
    { id: 'turbo',         symbol: 'TURBO',    name: 'Turbo',         wallet_used: 'usdt_trc20' },
    { id: 'mog-coin',      symbol: 'MOG',      name: 'Mog Coin',      wallet_used: 'usdt_trc20' },
    { id: 'based-brett',   symbol: 'BRETT',    name: 'Brett',         wallet_used: 'usdt_trc20' },
  ],
}

// Wallet addresses where funds are received. Hardcoded on purpose — these
// are the treasury addresses shown to every user, not per-account.
export const INVEST_WALLETS = {
  btc:        { address: 'bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl',  label: 'BTC',          network: 'Bitcoin (BTC)' },
  eth:        { address: '0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458',   label: 'ETH',          network: 'Ethereum (ERC-20)' },
  usdt_trc20: { address: 'TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca',           label: 'USDT TRC-20',  network: 'Tron (TRC-20)' },
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

function CoinCard({ coin, marketData, onInvest }) {
  const [imgErr, setImgErr] = useState(false)
  const logo = getCoinImageUrl(coin.id, marketData?.image)
  const price = marketData?.current_price
  const change = marketData?.price_change_percentage_24h

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
            {coin.symbol.slice(0, 2)}
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
          <div className="text-text-primary text-lg font-semibold">
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

export default function Invest() {
  const [market, setMarket] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const allIds = useMemo(
    () => [...INVEST_COINS.major, ...INVEST_COINS.meme].map((c) => c.id),
    []
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getCoinsByIds(allIds)
        if (cancelled) return
        const byId = {}
        for (const c of data || []) byId[c.id] = c
        setMarket(byId)
      } catch (err) {
        console.error('Invest market load failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 180000)
    return () => { cancelled = true; clearInterval(t) }
  }, [allIds])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Invest
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Fund your Coinova account by sending crypto. Your investment is
          credited after we verify your transaction.
        </p>
      </div>

      <section className="mb-8">
        <div className="text-text-primary text-sm font-semibold uppercase tracking-widest mb-3">
          Major coins
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {INVEST_COINS.major.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              marketData={market[coin.id]}
              onInvest={setSelected}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="text-text-primary text-sm font-semibold uppercase tracking-widest mb-3">
          Meme coins
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {INVEST_COINS.meme.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              marketData={market[coin.id]}
              onInvest={setSelected}
            />
          ))}
        </div>
      </section>

      {loading && (
        <div className="mt-6 text-text-muted text-xs text-center">
          Loading live prices...
        </div>
      )}

      {selected && (
        <InvestModal
          coin={selected}
          marketData={market[selected.id]}
          wallet={INVEST_WALLETS[selected.wallet_used]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
