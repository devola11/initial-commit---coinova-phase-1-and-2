import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HoldingsTable from '../components/HoldingsTable'
import TransactionHistory from '../components/TransactionHistory'
import InvestmentHistory from '../components/InvestmentHistory'
import BuyModal from '../components/BuyModal'
import SellModal from '../components/SellModal'
import CoinSearch from '../components/CoinSearch'
import RecurringBuyModal from '../components/RecurringBuyModal'
import { useHoldings } from '../hooks/useHoldings'
import { formatUSD, formatPercent } from '../utils/formatters'

const TABS = [
  { key: 'all', label: 'All', mode: undefined, color: '#8A919E' },
  { key: 'demo', label: 'Demo', mode: 'demo', color: '#F59E0B' },
  { key: 'wallet', label: 'Main Wallet', mode: 'wallet', color: '#0052FF' },
]

export default function Portfolio() {
  const { user } = useAuth()
  const [buyCoin, setBuyCoin] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurring, setRecurring] = useState([])
  const [tab, setTab] = useState('all')
  const { demoTotals, walletTotals, walletHoldings } = useHoldings()
  const tabMode = TABS.find((t) => t.key === tab)?.mode

  async function fetchRecurring() {
    if (!user) return
    const { data } = await supabase
      .from('recurring_buys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecurring(data || [])
  }

  useEffect(() => {
    fetchRecurring()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function toggleRecurring(r) {
    await supabase
      .from('recurring_buys')
      .update({ is_active: !r.is_active })
      .eq('id', r.id)
    fetchRecurring()
  }

  async function deleteRecurring(id) {
    await supabase.from('recurring_buys').delete().eq('id', id)
    fetchRecurring()
  }

  function handleBuyClick(coin) {
    if (coin) setBuyCoin(coin)
    else setShowSearch(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Portfolio
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowRecurring(true)}
            className="px-4 py-2 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors"
          >
            + Recurring buy
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="px-4 py-2 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
          >
            + Buy new coin
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors cursor-pointer`}
              style={
                active
                  ? { background: t.color, borderColor: t.color, color: t.key === 'demo' ? '#0A0B0D' : '#FFFFFF' }
                  : { background: 'transparent', borderColor: '#1E2025', color: '#8A919E' }
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'demo' && (
        <div
          className="mb-4 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#F59E0B' }}>
              Demo Account Holdings
            </div>
            <div className="text-text-primary font-semibold text-lg">
              {formatUSD(demoTotals.value)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-text-muted text-[10px] uppercase tracking-widest">Demo P&amp;L</div>
            <div
              className={`text-sm font-semibold ${demoTotals.pnl >= 0 ? 'text-profit' : 'text-loss'}`}
            >
              {formatUSD(demoTotals.pnl)} ({formatPercent(demoTotals.pnlPercent)})
            </div>
          </div>
        </div>
      )}

      {tab === 'wallet' && (
        <div
          className="mb-4 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
          style={{
            background: 'rgba(0, 82, 255, 0.08)',
            border: '1px solid rgba(0, 82, 255, 0.35)',
          }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#0052FF' }}>
              Main Wallet Holdings
            </div>
            <div className="text-text-primary font-semibold text-lg">
              {formatUSD(walletTotals.value)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-text-muted text-[10px] uppercase tracking-widest">Real P&amp;L</div>
            <div
              className={`text-sm font-semibold ${walletTotals.pnl >= 0 ? 'text-profit' : 'text-loss'}`}
            >
              {formatUSD(walletTotals.pnl)} ({formatPercent(walletTotals.pnlPercent)})
            </div>
          </div>
        </div>
      )}

      {tab === 'wallet' && walletHoldings.length === 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-10 text-center mb-6">
          <div className="text-text-primary font-semibold mb-2">
            No real holdings yet.
          </div>
          <div className="text-text-muted text-sm mb-5">
            Invest real crypto to get started.
          </div>
          <Link
            to="/invest"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors no-underline"
          >
            Invest Now
          </Link>
        </div>
      ) : (
        <div className="mb-6">
          <HoldingsTable onBuy={handleBuyClick} onSell={setSellHolding} mode={tabMode} />
        </div>
      )}

      {recurring.length > 0 && (
        <div className="mb-6 bg-card-bg border border-card-border rounded-xl p-6">
          <div className="text-text-primary font-semibold mb-4">
            Active recurring buys
          </div>
          <div className="space-y-3">
            {recurring.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-root-bg border border-card-border rounded-lg p-4 flex-wrap gap-3"
              >
                <div>
                  <div className="text-text-primary text-sm font-semibold uppercase">
                    {r.coin_symbol}
                  </div>
                  <div className="text-text-muted text-xs">
                    ${Number(r.amount_usd).toLocaleString()} · {r.frequency} · next{' '}
                    {r.next_run ? new Date(r.next_run).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      r.is_active
                        ? 'bg-profit/15 text-profit'
                        : 'bg-text-subtle/15 text-text-muted'
                    }`}
                  >
                    {r.is_active ? 'Active' : 'Paused'}
                  </span>
                  <button
                    onClick={() => toggleRecurring(r)}
                    className="px-3 py-1.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-xs font-semibold bg-transparent cursor-pointer transition-colors"
                  >
                    {r.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteRecurring(r.id)}
                    className="px-3 py-1.5 rounded-lg border border-card-border text-text-muted hover:border-loss hover:text-loss text-xs font-semibold bg-transparent cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TransactionHistory />

      <div className="mt-6">
        <InvestmentHistory />
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
      {showRecurring && (
        <RecurringBuyModal
          onClose={() => setShowRecurring(false)}
          onSaved={fetchRecurring}
        />
      )}
    </div>
  )
}
