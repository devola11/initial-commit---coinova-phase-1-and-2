import { useState, useEffect, useRef } from 'react'
import { getCoinPrice } from '../lib/coingecko'

export function useLivePrices(coinIds, intervalMs = 30000) {
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
        const data = await getCoinPrice(coinIds)
        if (isMounted.current) {
          setPrices(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err)
        if (isMounted.current) setLoading(false)
      }
    }

    fetchPrices()
    const timer = setInterval(fetchPrices, intervalMs)
    return () => clearInterval(timer)
  }, [coinIds.join(','), intervalMs])

  return { prices, loading }
}
