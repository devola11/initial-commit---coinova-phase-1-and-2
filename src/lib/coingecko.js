const BASE_URL = 'https://api.coingecko.com/api/v3'

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Cache-Control': 'no-cache',
}

// Fetch with a single 3-second retry so transient rate-limits / cold starts
// on serverless hosts (e.g. Vercel) don't bubble up as empty responses.
async function fetchJson(url) {
  async function attempt() {
    const res = await fetch(url, { headers: DEFAULT_HEADERS })
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`)
    return res.json()
  }
  try {
    return await attempt()
  } catch (err) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return attempt()
  }
}

export async function getTopCoins() {
  return fetchJson(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d`
  )
}

export async function getLivePrices(coinIds) {
  const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds
  return fetchJson(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  )
}

// Backward-compatible alias so BuyModal / SellModal / Alerts keep working.
export const getCoinPrice = getLivePrices

export async function getCoinDetail(coinId) {
  return fetchJson(
    `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  )
}

export async function getCoinChart(coinId, days = 7) {
  return fetchJson(
    `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  )
}

export async function searchCoins(query) {
  const data = await fetchJson(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`
  )
  return data.coins?.slice(0, 10) || []
}
