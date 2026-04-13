export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch(
      'https://api.alternative.me/fng/?limit=30',
      { headers: { 'Accept': 'application/json' } }
    )
    const data = await r.json()
    res.setHeader('Cache-Control', 's-maxage=3600')
    res.status(200).json(data)
  } catch(e) {
    res.status(500).json({ data: [] })
  }
}
