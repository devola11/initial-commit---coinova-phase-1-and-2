import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CoinSearch from './CoinSearch'

const FREQUENCIES = [
  { key: 'daily', label: 'Daily', ms: 24 * 60 * 60 * 1000 },
  { key: 'weekly', label: 'Weekly', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: 'monthly', label: 'Monthly', ms: 30 * 24 * 60 * 60 * 1000 },
]

export default function RecurringBuyModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const [coin, setCoin] = useState(null)
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('weekly')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!coin || !amount || Number(amount) <= 0) {
      setError('Pick a coin and amount')
      return
    }
    setSubmitting(true)
    try {
      const ms = FREQUENCIES.find((f) => f.key === frequency)?.ms || 0
      const nextRun = new Date(Date.now() + ms).toISOString()
      const { error: e } = await supabase.from('recurring_buys').insert({
        user_id: user.id,
        coin_id: coin.id,
        coin_symbol: (coin.symbol || '').toLowerCase(),
        amount_usd: Number(amount),
        frequency,
        next_run: nextRun,
        is_active: true,
      })
      if (e) throw e
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-text-primary font-semibold">New recurring buy</div>
            <div className="text-text-muted text-xs">Auto-buy on a schedule</div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Coin
        </label>
        {coin ? (
          <div className="flex items-center gap-3 bg-root-bg border border-card-border rounded-lg p-3 mb-4">
            {coin.image && (
              <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-text-primary text-sm font-semibold truncate">{coin.name}</div>
              <div className="text-text-muted text-xs uppercase">{coin.symbol}</div>
            </div>
            <button
              onClick={() => setCoin(null)}
              className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-sm"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <CoinSearch onSelect={setCoin} placeholder="Search coin..." />
          </div>
        )}

        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Amount (USD)
        </label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors mb-4"
        />

        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Frequency
        </label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {FREQUENCIES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFrequency(f.key)}
              className={`px-2 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                frequency === f.key
                  ? 'border-primary-blue text-primary-blue bg-primary-blue/10'
                  : 'border-card-border text-text-primary bg-transparent hover:border-primary-blue'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 border-none cursor-pointer transition-colors"
        >
          {submitting ? 'Saving...' : 'Save recurring buy'}
        </button>
      </div>
    </div>
  )
}
