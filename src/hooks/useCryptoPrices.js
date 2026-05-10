import { useState, useEffect } from 'react'

export function useCryptoPrices() {
  const [prices, setPrices] = useState({
    BTC: 0,
    ETH: 0,
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        '/api/prices?ids=bitcoin,ethereum&vs_currencies=usd'
      )
      const data = await response.json()
      setPrices({
        BTC: data.bitcoin?.usd || 0,
        ETH: data.ethereum?.usd || 0,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })
    } catch (e) {
      setPrices(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch prices'
      }))
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  return prices
}
