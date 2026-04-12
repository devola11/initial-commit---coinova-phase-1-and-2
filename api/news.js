export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  const { symbol = '', name = '' } = req.query
  const coinName = name.toLowerCase()
  const coinSymbol = symbol.toLowerCase()

  try {
    const sources = [
      'https://feeds.feedburner.com/CoinDesk',
      'https://cointelegraph.com/rss',
      'https://decrypt.co/feed',
    ]

    const results = []

    for (const url of sources) {
      try {
        const r = await fetch(url, {
          headers: {
            Accept: 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0',
          },
          signal: AbortSignal.timeout(4000),
        })
        const xml = await r.text()

        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

        for (const item of items.slice(0, 30)) {
          const title =
            item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
            item.match(/<title>(.*?)<\/title>/)?.[1] ||
            ''
          const link =
            item.match(/<link>(.*?)<\/link>/)?.[1] ||
            item.match(/<link[^>]*href="(.*?)"/)?.[1] ||
            ''
          const pubDate =
            item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          const description =
            item.match(
              /<description><!\[CDATA\[(.*?)\]\]><\/description>/
            )?.[1] ||
            item.match(/<description>(.*?)<\/description>/)?.[1] ||
            ''
          const source = url.includes('coindesk')
            ? 'CoinDesk'
            : url.includes('cointelegraph')
              ? 'CoinTelegraph'
              : url.includes('decrypt')
                ? 'Decrypt'
                : 'Crypto News'

          const titleLower = title.toLowerCase()
          const descLower = description.toLowerCase()

          if (
            titleLower.includes(coinName) ||
            titleLower.includes(coinSymbol) ||
            descLower.includes(coinName) ||
            descLower.includes(coinSymbol)
          ) {
            results.push({
              title,
              link,
              pubDate,
              source,
              description: '',
              matched: true,
            })
          }
        }
      } catch (e) {
        continue
      }
    }

    // Fallback: latest general crypto news if no coin-specific results
    if (results.length === 0) {
      try {
        const r = await fetch('https://cointelegraph.com/rss', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000),
        })
        const xml = await r.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

        for (const item of items.slice(0, 8)) {
          const title =
            item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
            item.match(/<title>(.*?)<\/title>/)?.[1] ||
            ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate =
            item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          results.push({
            title,
            link,
            pubDate,
            source: 'CoinTelegraph',
            description: '',
            matched: false,
          })
        }
      } catch (e) {
        // all sources failed
      }
    }

    res.setHeader('Cache-Control', 's-maxage=120')
    res.status(200).json(results.slice(0, 10))
  } catch (e) {
    res.status(500).json([])
  }
}
