export function formatUSD(value) {
  if (value == null) return '$0.00'
  if (value > 0 && value < 0.01) return formatSmallPrice(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

export function formatSmallPrice(value) {
  if (value == null || value === 0) return '$0.00'
  // Show 6 significant digits for very small meme coin prices
  const str = value.toPrecision(6)
  return `$${str}`
}

export function formatMarketCap(value) {
  if (value == null) return '$0'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

export function formatPercent(value) {
  if (value == null) return '0.00%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value, decimals = 2) {
  if (value == null) return '0'
  if (value >= 1e12) return `${(value / 1e12).toFixed(decimals)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`
  return value.toFixed(decimals)
}

export function formatCrypto(value) {
  if (value == null) return '0'
  if (value >= 1) return value.toFixed(4)
  return value.toFixed(8)
}

export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
