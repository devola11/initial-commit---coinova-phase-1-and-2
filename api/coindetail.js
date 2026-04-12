export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const { id } = req.query
  if (!id) {
    res.status(400).json({})
    return
  }
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      { headers: { Accept: 'application/json' } }
    )
    const data = await r.json()
    res.setHeader('Cache-Control', 's-maxage=120')
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({})
  }
}
