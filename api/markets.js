export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const { ids } = req.query
  const base = 'https://api.coingecko.com/api/v3/coins/markets'
  const url = ids
    ? `${base}?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d`
    : `${base}?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d`
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
