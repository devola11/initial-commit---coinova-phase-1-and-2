export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const { symbol, name } = req.query

  try {
    // Primary: CryptoPanic free API
    const r = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&currencies=${encodeURIComponent(symbol || '')}&kind=news&public=true`,
      { headers: { Accept: 'application/json' } }
    )
    const data = await r.json()

    if (data.results && data.results.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=120')
      return res.status(200).json(data.results)
    }

    // Fallback: CoinGecko general news filtered by name/symbol
    const fallback = await fetch(
      'https://api.coingecko.com/api/v3/news?page=1',
      { headers: { Accept: 'application/json' } }
    )
    const fallbackData = await fallback.json()
    const articles = fallbackData.data || []
    const nameLC = (name || '').toLowerCase()
    const symLC = (symbol || '').toLowerCase()
    const filtered = articles.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(nameLC) ||
        (a.title || '').toLowerCase().includes(symLC)
    )

    res.setHeader('Cache-Control', 's-maxage=120')
    res.status(200).json(filtered.length > 0 ? filtered : articles.slice(0, 10))
  } catch (e) {
    res.status(500).json([])
  }
}
