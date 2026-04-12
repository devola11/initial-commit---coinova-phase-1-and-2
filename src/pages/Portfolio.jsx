import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HoldingsTable from '../components/HoldingsTable'
import TransactionHistory from '../components/TransactionHistory'
import InvestmentHistory from '../components/InvestmentHistory'
import BuyModal from '../components/BuyModal'
import SellModal from '../components/SellModal'
import CoinSearch from '../components/CoinSearch'
import RecurringBuyModal from '../components/RecurringBuyModal'

export default function Portfolio() {
  const { user } = useAuth()
  const [buyCoin, setBuyCoin] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [recurring, setRecurring] = useState([])

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
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Portfolio
        </h1>
        <div className="flex gap-2">
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

      <div className="mb-6">
        <HoldingsTable onBuy={handleBuyClick} onSell={setSellHolding} />
      </div>

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
                    {r.next_run ? new Date(r.next_run).toLocaleDateString() : '—'}
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
