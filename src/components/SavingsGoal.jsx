import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import CoinSearch from './CoinSearch'
import { formatCrypto } from '../utils/formatters'

export default function SavingsGoal() {
  const { user } = useAuth()
  const { holdings } = usePortfolio()
  const [goals, setGoals] = useState([])
  const [adding, setAdding] = useState(false)
  const [coin, setCoin] = useState(null)
  const [target, setTarget] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchGoals() {
    if (!user) return
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleSave() {
    setError('')
    if (!coin || !target || Number(target) <= 0) {
      setError('Pick a coin and target')
      return
    }
    try {
      const { error: e } = await supabase.from('savings_goals').insert({
        user_id: user.id,
        coin_id: coin.id,
        coin_symbol: (coin.symbol || '').toLowerCase(),
        target_quantity: Number(target),
        target_date: date || null,
      })
      if (e) throw e
      setCoin(null)
      setTarget('')
      setDate('')
      setAdding(false)
      fetchGoals()
    } catch (err) {
      setError(err.message || 'Failed to save')
    }
  }

  async function deleteGoal(id) {
    await supabase.from('savings_goals').delete().eq('id', id)
    fetchGoals()
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-text-muted font-medium">
            Savings goals
          </div>
          <div className="text-text-primary font-semibold mt-1">
            Track your accumulation targets
          </div>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-semibold border-none cursor-pointer transition-colors"
        >
          {adding ? 'Cancel' : '+ New goal'}
        </button>
      </div>

      {adding && (
        <div className="bg-root-bg border border-card-border rounded-lg p-4 mb-4 space-y-3">
          {coin ? (
            <div className="flex items-center gap-3 bg-card-bg border border-card-border rounded-lg p-2">
              {coin.image && (
                <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
              )}
              <div className="flex-1 text-text-primary text-sm">{coin.name}</div>
              <button
                onClick={() => setCoin(null)}
                className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xs"
              >
                Change
              </button>
            </div>
          ) : (
            <CoinSearch onSelect={setCoin} placeholder="Pick a coin..." />
          )}
          <input
            type="number"
            min="0"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target quantity (e.g. 1)"
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
          />
          {error && <div className="text-loss text-xs">{error}</div>}
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
          >
            Save goal
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-text-muted text-sm py-2">
          No savings goals yet. Set one to start accumulating.
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const held =
              holdings.find((h) => h.coin_id === g.coin_id)?.quantity || 0
            const target = Number(g.target_quantity)
            const pct = target > 0 ? Math.min(100, (held / target) * 100) : 0
            return (
              <div
                key={g.id}
                className="border border-card-border rounded-lg p-4 bg-root-bg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-text-primary text-sm font-semibold">
                    {formatCrypto(target)} {g.coin_symbol?.toUpperCase()}
                    {g.target_date && (
                      <span className="text-text-muted text-xs ml-2">
                        by {new Date(g.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-text-muted hover:text-loss bg-transparent border-none cursor-pointer text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div className="w-full h-2 bg-card-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-blue transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-text-muted">
                    {formatCrypto(held)} / {formatCrypto(target)}{' '}
                    {g.coin_symbol?.toUpperCase()}
                  </span>
                  <span className="text-text-primary font-semibold">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
