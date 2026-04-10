import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCoinPrice } from '../lib/coingecko'
import CoinSearch from '../components/CoinSearch'
import AlertCard from '../components/AlertCard'

export default function Alerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [coin, setCoin] = useState(null)
  const [condition, setCondition] = useState('above')
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setAlerts(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Periodic price check
  useEffect(() => {
    if (!alerts.length) return
    let cancelled = false

    async function check() {
      const ids = [
        ...new Set(
          alerts
            .filter((a) => a.is_active && !a.triggered_at)
            .map((a) => a.coin_id)
        ),
      ]
      if (!ids.length) return
      try {
        const prices = await getCoinPrice(ids)
        if (cancelled) return
        for (const a of alerts) {
          if (!a.is_active || a.triggered_at) continue
          const price = prices[a.coin_id]?.usd
          if (price == null) continue
          const target = Number(a.target_price)
          const hit =
            (a.condition === 'above' && price >= target) ||
            (a.condition === 'below' && price <= target)
          if (hit) {
            await supabase
              .from('alerts')
              .update({ triggered_at: new Date().toISOString() })
              .eq('id', a.id)
          }
        }
        fetchAlerts()
      } catch (err) {
        console.error(err)
      }
    }

    check()
    const t = setInterval(check, 60000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [alerts, fetchAlerts])

  async function handleSave() {
    setError('')
    if (!coin || !target || Number(target) <= 0) {
      setError('Pick a coin and target price')
      return
    }
    setSaving(true)
    try {
      const { error: e } = await supabase.from('alerts').insert({
        user_id: user.id,
        coin_id: coin.id,
        symbol: (coin.symbol || '').toLowerCase(),
        name: coin.name,
        image: coin.image,
        condition,
        target_price: Number(target),
        is_active: true,
      })
      if (e) throw e
      setCoin(null)
      setTarget('')
      fetchAlerts()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
        Price alerts
      </h1>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
        <div className="text-text-primary font-semibold mb-4">New alert</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div className="md:col-span-5">
            {coin ? (
              <div className="flex items-center gap-3 bg-root-bg border border-card-border rounded-lg p-3 h-[46px]">
                {coin.image && (
                  <img
                    src={coin.image}
                    alt={coin.symbol}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <div className="flex-1 text-text-primary text-sm font-semibold truncate">
                  {coin.name}
                </div>
                <button
                  onClick={() => setCoin(null)}
                  className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xs"
                >
                  Change
                </button>
              </div>
            ) : (
              <CoinSearch onSelect={setCoin} placeholder="Search coin..." />
            )}
          </div>
          <div className="md:col-span-3">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-blue h-[46px]"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target $"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-blue h-[46px]"
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 border-none cursor-pointer transition-colors h-[46px]"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center text-text-muted text-sm">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center text-text-muted text-sm">
            No alerts yet. Set one above to get notified.
          </div>
        ) : (
          alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onChange={fetchAlerts} />
          ))
        )}
      </div>
    </div>
  )
}
