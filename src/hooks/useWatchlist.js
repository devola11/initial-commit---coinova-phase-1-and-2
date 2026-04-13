import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWatchlist() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setWatchlist([]); setLoading(false); return }
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    setWatchlist(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const isWatched = useCallback(
    (coinId) => watchlist.some((w) => w.coin_id === coinId),
    [watchlist]
  )

  const toggle = useCallback(
    async (coin) => {
      if (!user) return false
      const existing = watchlist.find((w) => w.coin_id === coin.id)
      if (existing) {
        // optimistic remove
        setWatchlist((prev) => prev.filter((w) => w.coin_id !== coin.id))
        await supabase.from('watchlist').delete().eq('id', existing.id)
        return false // removed
      } else {
        // optimistic add
        const newItem = {
          id: crypto.randomUUID(),
          user_id: user.id,
          coin_id: coin.id,
          coin_symbol: coin.symbol,
          coin_name: coin.name,
          coin_image: coin.image || null,
          added_at: new Date().toISOString(),
        }
        setWatchlist((prev) => [newItem, ...prev])
        await supabase.from('watchlist').insert({
          user_id: user.id,
          coin_id: coin.id,
          coin_symbol: coin.symbol,
          coin_name: coin.name,
          coin_image: coin.image || null,
        })
        return true // added
      }
    },
    [user, watchlist]
  )

  return { watchlist, loading, isWatched, toggle, refresh: load }
}
