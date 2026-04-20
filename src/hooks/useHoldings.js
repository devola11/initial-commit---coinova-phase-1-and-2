import { useMemo } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { useLivePrices } from './useLivePrices'
import { calculateProfitLoss } from '../utils/calculations'

function totalsOf(list) {
  const value = list.reduce((s, h) => s + h.currentValue, 0)
  const cost = list.reduce((s, h) => s + h.costBasis, 0)
  const pnl = value - cost
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0
  return { value, cost, pnl, pnlPercent }
}

export function useHoldings(options = {}) {
  const { mode } = options
  const { holdings, loading: holdingsLoading } = usePortfolio()

  const coinIds = useMemo(
    () => [...new Set(holdings.map((h) => h.coin_id))],
    [holdings]
  )

  const { prices, loading: pricesLoading } = useLivePrices(coinIds)

  const enrichedAll = useMemo(() => {
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
        account_type: h.account_type || 'demo',
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

  const demoHoldings = useMemo(
    () => enrichedAll.filter((h) => h.account_type === 'demo'),
    [enrichedAll]
  )
  const walletHoldings = useMemo(
    () => enrichedAll.filter((h) => h.account_type === 'wallet'),
    [enrichedAll]
  )

  const visible = mode === 'demo'
    ? demoHoldings
    : mode === 'wallet'
      ? walletHoldings
      : enrichedAll

  const demoTotals = useMemo(() => totalsOf(demoHoldings), [demoHoldings])
  const walletTotals = useMemo(() => totalsOf(walletHoldings), [walletHoldings])
  const allTotals = useMemo(() => totalsOf(enrichedAll), [enrichedAll])
  const visibleTotals = useMemo(() => totalsOf(visible), [visible])

  return {
    holdings: visible,
    allHoldings: enrichedAll,
    demoHoldings,
    walletHoldings,
    totalValue: visibleTotals.value,
    totalCost: visibleTotals.cost,
    totalPnl: visibleTotals.pnl,
    totalPnlPercent: visibleTotals.pnlPercent,
    demoTotals,
    walletTotals,
    allTotals,
    loading: holdingsLoading || pricesLoading,
  }
}
