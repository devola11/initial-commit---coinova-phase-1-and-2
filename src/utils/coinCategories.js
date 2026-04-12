// Category membership is hand-curated against CoinGecko IDs. Anything that
// doesn't match one of the themed buckets falls through to ALTCOINS, which
// keeps the catalog exhaustive without us having to enumerate every chain.

export const CATEGORY_TABS = [
  'ALL',
  'MAJOR',
  'ALTCOINS',
  'MEME',
  'DEFI',
  'LAYER2',
  'AI',
  'STABLE',
]

const MAJOR = new Set([
  'bitcoin',
  'ethereum',
  'binancecoin',
  'ripple',
  'solana',
  'cardano',
])

const MEME = new Set([
  'shiba-inu',
  'pepe',
  'dogecoin',
  'floki',
  'baby-doge-coin',
  'bonk',
  'wojak',
  'turbo',
  'mog-coin',
  'based-brett',
  'dogwifcoin',
  'coq-inu',
  'myro',
  'popcat',
])

const DEFI = new Set([
  'uniswap',
  'aave',
  'chainlink',
  'maker',
  'compound',
  'curve-dao-token',
  'yearn-finance',
  'sushi',
  'balancer',
  '1inch',
])

const LAYER2 = new Set([
  'matic-network',
  'arbitrum',
  'optimism',
  'starknet',
  'polygon',
  'immutable-x',
  'metis-token',
  'boba-network',
])

const AI = new Set([
  'fetch-ai',
  'singularitynet',
  'render-token',
  'bittensor',
  'ocean-protocol',
  'numeraire',
  'cortex',
  'matrix-ai-network',
])

const STABLE = new Set([
  'tether',
  'usd-coin',
  'dai',
  'true-usd',
  'frax',
  'usdd',
  'neutrino',
])

// Returns the first matching category, defaulting to ALTCOINS. Order matters
// because a coin could technically sit in multiple buckets (e.g. chainlink is
// both MAJOR-ish and DEFI) and the first match wins.
export function categoryFor(coinId) {
  if (MAJOR.has(coinId)) return 'MAJOR'
  if (STABLE.has(coinId)) return 'STABLE'
  if (MEME.has(coinId)) return 'MEME'
  if (DEFI.has(coinId)) return 'DEFI'
  if (LAYER2.has(coinId)) return 'LAYER2'
  if (AI.has(coinId)) return 'AI'
  return 'ALTCOINS'
}

export function filterByCategory(coins, category) {
  if (!category || category === 'ALL') return coins
  return coins.filter((c) => categoryFor(c.id) === category)
}

export function filterBySearch(coins, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return coins
  return coins.filter((c) => {
    const name = String(c.name || '').toLowerCase()
    const symbol = String(c.symbol || '').toLowerCase()
    return name.includes(q) || symbol.includes(q)
  })
}

// Wallet routing for investments. BTC and ETH have their own treasury
// addresses; everything else lands on the USDT TRC-20 address so deposits
// converge on one chain for settlement.
export function walletForCoin(coinId) {
  if (coinId === 'bitcoin') return 'btc'
  if (coinId === 'ethereum') return 'eth'
  return 'usdt_trc20'
}
