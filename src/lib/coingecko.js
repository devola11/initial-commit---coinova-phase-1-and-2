const BASE_URL = 'https://api.coingecko.com/api/v3'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`)
  return res.json()
}

export async function getMarkets(page = 1, perPage = 50) {
  return fetchJson(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`
  )
}

export async function getCoinPrice(coinIds) {
  const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds
  return fetchJson(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currency=usd&include_24hr_change=true`
  )
}

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
  const data = await fetchJson(`${BASE_URL}/search?query=${encodeURIComponent(query)}`)
  return data.coins?.slice(0, 10) || []
}
