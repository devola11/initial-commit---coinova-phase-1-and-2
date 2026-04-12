// All network calls go through our Vercel serverless proxy (/api/*) to sidestep
// CoinGecko CORS blocks and rate-limit 429/422s from the browser. The proxy
// lives under api/ at the project root and runs on the same origin as the app.

const DIRECT_BASE = 'https://api.coingecko.com/api/v3'

// Static last-resort prices, used when both the proxy and direct fetch fail.
// Shape mirrors CoinGecko's /simple/price response.
export const FALLBACK_PRICES = {
  bitcoin:     { usd: 72000, usd_24h_change: 2.1 },
  ethereum:    { usd: 2200,  usd_24h_change: -0.8 },
  solana:      { usd: 178,   usd_24h_change: 3.2 },
  binancecoin: { usd: 605,   usd_24h_change: 0.5 },
  chainlink:   { usd: 15,    usd_24h_change: 1.2 },
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function getTopCoins() {
  try {
    return await fetchJson('/api/markets')
  } catch (err) {
    console.error('getTopCoins proxy failed:', err)
    try {
      return await fetchJson(
        `${DIRECT_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d`
      )
    } catch (err2) {
      console.error('getTopCoins direct failed:', err2)
      return []
    }
  }
}

// Fetch /coins/markets filtered by specific CoinGecko IDs — used by the
// Invest page so we only pull the 12 coins it shows, and get back the real
// image URLs alongside price and 24h change in a single call.
export async function getCoinsByIds(ids) {
  const idList = Array.isArray(ids) ? ids.join(',') : ids
  try {
    return await fetchJson(`/api/markets?ids=${encodeURIComponent(idList)}`)
  } catch (err) {
    console.error('getCoinsByIds proxy failed:', err)
    return []
  }
}

export async function getLivePrices(coinIds) {
  const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds
  try {
    return await fetchJson(`/api/prices?ids=${ids}`)
  } catch (err) {
    console.error('getLivePrices proxy failed:', err)
    const out = {}
    const list = Array.isArray(coinIds) ? coinIds : String(ids).split(',')
    for (const id of list) {
      if (FALLBACK_PRICES[id]) out[id] = FALLBACK_PRICES[id]
    }
    return out
  }
}

// Alias kept for BuyModal / SellModal / Alerts which import getCoinPrice.
export const getCoinPrice = getLivePrices

export async function getCoinDetail(coinId) {
  return fetchJson(
    `${DIRECT_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  )
}

export async function getCoinChart(coinId, days = 7) {
  return fetchJson(
    `${DIRECT_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  )
}

export async function searchCoins(query) {
  try {
    const data = await fetchJson(`/api/search?query=${encodeURIComponent(query)}`)
    return data.coins?.slice(0, 10) || []
  } catch (err) {
    console.error('searchCoins proxy failed:', err)
    return []
  }
}
