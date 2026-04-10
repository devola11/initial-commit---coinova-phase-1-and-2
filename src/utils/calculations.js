export const FEE_RATE = 0.001 // 0.1%

export function calculateBuy(usdAmount, pricePerCoin) {
  const fee = usdAmount * FEE_RATE
  const netUsd = usdAmount - fee
  const quantity = netUsd / pricePerCoin
  return { fee, netUsd, quantity }
}

export function calculateSell(quantity, pricePerCoin) {
  const grossUsd = quantity * pricePerCoin
  const fee = grossUsd * FEE_RATE
  const netUsd = grossUsd - fee
  return { grossUsd, fee, netUsd }
}

export function calculateProfitLoss(currentPrice, buyPrice, quantity) {
  const currentValue = currentPrice * quantity
  const costBasis = buyPrice * quantity
  const pnl = currentValue - costBasis
  const pnlPercent = costBasis > 0 ? ((pnl / costBasis) * 100) : 0
  return { currentValue, costBasis, pnl, pnlPercent }
}

export function calculatePortfolioValue(holdings, prices) {
  return holdings.reduce((total, h) => {
    const price = prices[h.coin_id]?.usd || 0
    return total + h.quantity * price
  }, 0)
}
