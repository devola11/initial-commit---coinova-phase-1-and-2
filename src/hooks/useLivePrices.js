import { useState, useEffect, useRef } from 'react'
import { getLivePrices } from '../lib/coingecko'

// Static last-resort prices used if CoinGecko is unreachable / rate-limited.
// Shape matches the /simple/price response so consumers read it identically.
const FALLBACK_PRICES = {
  bitcoin:     { usd: 72000, usd_24h_change: 0 },
  ethereum:    { usd: 2200,  usd_24h_change: 0 },
  solana:      { usd: 178,   usd_24h_change: 0 },
  binancecoin: { usd: 605,   usd_24h_change: 0 },
  chainlink:   { usd: 15,    usd_24h_change: 0 },
}

function buildFallback(coinIds) {
  const out = {}
  for (const id of coinIds) {
    if (FALLBACK_PRICES[id]) out[id] = FALLBACK_PRICES[id]
  }
  return out
}

export function useLivePrices(coinIds, intervalMs = 120000) {
  const [prices, setPrices] = useState({})
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

    async function fetchPrices() {
      try {
        const data = await getLivePrices(coinIds)
        if (isMounted.current) {
          setPrices(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch prices, using fallback:', err)
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
