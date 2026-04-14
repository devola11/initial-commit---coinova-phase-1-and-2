import { useState, useEffect, useRef } from 'react'
import { getLivePrices, FALLBACK_PRICES } from '../lib/coingecko'

function buildFallback(coinIds) {
  const out = {}
  for (const id of coinIds) {
    if (FALLBACK_PRICES[id]) out[id] = FALLBACK_PRICES[id]
  }
  return out
}

// Poll every 3 minutes by default - CoinGecko's free tier will 429 faster than
// that when many tabs hit it at once.
export function useLivePrices(coinIds, intervalMs = 180000) {
  const [prices, setPrices] = useState(() => buildFallback(coinIds || []))
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (!coinIds || coinIds.length === 0) {
      setLoading(false)
      return
    }

    // Seed with fallback so the UI has numbers immediately, even before the
    // first proxy call resolves. Real data overwrites this on success.
    setPrices((prev) => ({ ...buildFallback(coinIds), ...prev }))

    async function fetchPrices() {
      try {
        const data = await getLivePrices(coinIds)
        if (!isMounted.current) return
        const merged = { ...buildFallback(coinIds), ...data }
        setPrices(merged)
        setLoading(false)
      } catch (err) {
        console.error('useLivePrices failed, using fallback:', err)
        if (isMounted.current) {
          setPrices(buildFallback(coinIds))
          setLoading(false)
        }
      }
    }

    fetchPrices()
    const timer = setInterval(fetchPrices, intervalMs)
    return () => clearInterval(timer)
  }, [coinIds.join(','), intervalMs])

  return { prices, loading }
}
