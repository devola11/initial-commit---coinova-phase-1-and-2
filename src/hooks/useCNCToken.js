import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_TOKEN = {
  price: 0.05,
  change_24h: 5.2,
  total_sold: 0,
  total_usdt_received: 0,
  holders_count: 0,
  total_supply: 100000000,
  presale_cap: 50000000,
  launch_price: 0.10,
}

export function useCNCToken() {
  const [data, setData] = useState(DEFAULT_TOKEN)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data: row, error } = await supabase
        .from('cnc_token')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (row) {
        setData({
          price: Number(row.price) || DEFAULT_TOKEN.price,
          change_24h: Number(row.change_24h) || 0,
          total_sold: Number(row.total_sold) || 0,
          total_usdt_received: Number(row.total_usdt_received) || 0,
          holders_count: Number(row.holders_count) || 0,
          total_supply: Number(row.total_supply) || DEFAULT_TOKEN.total_supply,
          presale_cap: Number(row.presale_cap) || DEFAULT_TOKEN.presale_cap,
          launch_price: Number(row.launch_price) || DEFAULT_TOKEN.launch_price,
        })
      }
    } catch (err) {
      console.warn('useCNCToken load failed, using defaults', err?.message || err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  const marketCap = (Number(data.price) || 0) * (Number(data.total_supply) || 0)

  return {
    ...data,
    marketCap,
    loading,
    refresh: load,
  }
}
