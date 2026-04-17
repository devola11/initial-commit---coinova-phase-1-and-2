export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods',
    'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  const { coinName, coinSymbol, lessonNumber = 1 } =
    req.body || {}

  if (!coinName || !coinSymbol) {
    return res.status(400).json({
      error: 'Missing coinName or coinSymbol'
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set')
    return res.status(500).json({
      error: 'API key not configured'
    })
  }

  const topics = {
    1: 'basics, history and purpose',
    2: 'technology and how it works',
    3: 'investment potential and risks'
  }
  const topic = topics[lessonNumber] || topics[1]

  const prompt = `You are a crypto education expert. Create a short beginner lesson about ${coinName} (${coinSymbol}) focusing on: ${topic}.

Respond with ONLY valid JSON in this exact format:
{
  "title": "lesson title here",
  "content": "150 word educational content here",
  "keyFact": "one interesting fact here",
  "quiz": {
    "question": "quiz question here",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "explanation here"
  }
}
No extra text before or after the JSON.`

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
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('API error:', response.status, errText)
      return res.status(500).json({
        error: 'AI service error: ' + response.status
      })
    }

    const data = await response.json()

    if (!data.content?.[0]?.text) {
      return res.status(500).json({
        error: 'Empty AI response'
      })
    }

    const rawText = data.content[0].text
    const clean = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let lesson
    try {
      lesson = JSON.parse(clean)
    } catch(e) {
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) {
        lesson = JSON.parse(match[0])
      } else {
        return res.status(500).json({
          error: 'Could not parse AI response'
        })
      }
    }

    if (!lesson.title || !lesson.content || !lesson.quiz) {
      return res.status(500).json({
        error: 'Invalid lesson structure'
      })
    }

    res.setHeader('Cache-Control', 's-maxage=3600')
    return res.status(200).json(lesson)

  } catch(err) {
    console.error('Error:', err.message)
    return res.status(500).json({
      error: err.message || 'Server error'
    })
  }
}
