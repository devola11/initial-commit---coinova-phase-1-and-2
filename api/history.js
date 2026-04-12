export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const { id, days = 7 } = req.query
  if (!id) {
    res.status(400).json({ prices: [] })
    return
  }
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,
      { headers: { Accept: 'application/json' } }
    )
    const data = await r.json()
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ prices: [] })
  }
}
