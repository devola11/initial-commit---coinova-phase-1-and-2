export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'ANTHROPIC_API_KEY is not set',
      keyExists: false
    })
  }

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: 'Say hello in one word'
          }]
        })
      }
    )

    const data = await response.json()

    return res.status(200).json({
      status: response.ok ? 'OK' : 'ERROR',
      httpStatus: response.status,
      keyExists: true,
      keyPrefix: apiKey.substring(0, 15) + '...',
      response: data
    })
  } catch(err) {
    return res.status(200).json({
      status: 'ERROR',
      keyExists: true,
      message: err.message
    })
  }
}
