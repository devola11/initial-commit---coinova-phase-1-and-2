import { useMemo } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { useLivePrices } from './useLivePrices'
import { calculateProfitLoss } from '../utils/calculations'

export function useHoldings() {
  const { holdings, loading: holdingsLoading } = usePortfolio()

  const coinIds = useMemo(
    () => [...new Set(holdings.map((h) => h.coin_id))],
    [holdings]
  )

  const { prices, loading: pricesLoading } = useLivePrices(coinIds)

  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const currentPrice = prices[h.coin_id]?.usd || 0
      const change24h = prices[h.coin_id]?.usd_24h_change || 0
      const { currentValue, costBasis, pnl, pnlPercent } = calculateProfitLoss(
        currentPrice,
        h.buy_price_usd,
        h.quantity
      )
      return {
        ...h,
        coin_symbol: h.coin_symbol || (h.symbol || '').toUpperCase(),
        currentPrice,
        change24h,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
      }
    })
  }, [holdings, prices])

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.costBasis, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return {
    holdings: enrichedHoldings,
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    loading: holdingsLoading || pricesLoading,
  }
}
