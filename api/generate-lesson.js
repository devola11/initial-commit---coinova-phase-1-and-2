export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { coinName, coinSymbol, lessonNumber = 1 } = req.body

  if (!coinName || !coinSymbol) {
    return res.status(400).json({ error: 'Missing coin data' })
  }

  const lessonTopics = {
    1: 'basics, history and purpose',
    2: 'technology and how it works',
    3: 'investment potential and risks',
  }

  const topic = lessonTopics[lessonNumber] || 'basics and overview'

  const prompt = `You are a crypto education expert.
Create a beginner lesson about ${coinName} (${coinSymbol}).
Topic: ${topic}

Respond with ONLY this JSON (no markdown, no extra text):
{
  "title": "short lesson title",
  "content": "150-200 word educational content for beginners",
  "keyFact": "one interesting fact about ${coinName}",
  "quiz": {
    "question": "quiz question about ${coinName}",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "why this answer is correct"
  }
}`

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errData = await response.text()
      console.error('Anthropic API error:', errData)
      return res.status(500).json({ error: 'AI service error' })
    }

    const data = await response.json()

    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    const text = data.content[0].text
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()

    let lesson
    try {
      lesson = JSON.parse(clean)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw text:', text)
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }

    if (!lesson.title || !lesson.content || !lesson.quiz) {
      return res.status(500).json({ error: 'Invalid lesson structure' })
    }

    res.setHeader('Cache-Control', 's-maxage=3600')
    return res.status(200).json(lesson)
  } catch (e) {
    console.error('Generate lesson error:', e)
    return res.status(500).json({
      error: e.message || 'Failed to generate lesson',
    })
  }
}
