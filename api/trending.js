export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const [trendingRes, marketsRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/search/trending', {
        headers: { 'Accept': 'application/json' }
      }),
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h', {
        headers: { 'Accept': 'application/json' }
      })
    ])
    const trending = await trendingRes.json()
    const markets = await marketsRes.json()

    const gainers = [...markets]
      .filter(c => c.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 7)

    const losers = [...markets]
      .filter(c => c.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 7)

    res.setHeader('Cache-Control', 's-maxage=300')
    res.status(200).json({
      trending: trending.coins?.slice(0, 7) || [],
      gainers,
      losers
    })
  } catch (e) {
    res.status(500).json({ trending: [], gainers: [], losers: [] })
  }
}
