export default async function handler(req, res) {
  const { page = 1, per_page = 50, ids } = req.query
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  try {
    let url
    if (ids) {
      url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`
    } else {
      url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=${page}&sparkline=false&price_change_percentage=24h,7d`
    }
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(Array.isArray(data) ? data : [])
  } catch (err) {
    res.status(500).json([])
  }
}
