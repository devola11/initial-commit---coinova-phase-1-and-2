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

  const { coinName, coinSymbol, coinId, lessonNumber } = req.body

  if (!coinName || !coinSymbol) {
    return res.status(400).json({ error: 'Missing coin data' })
  }

  const lessonTopics = {
    1: 'basics and history',
    2: 'technology and how it works',
    3: 'investment and future potential'
  }

  const topic = lessonTopics[lessonNumber] || 'basics'

  const prompt = `You are a crypto education expert.
Create a beginner-friendly lesson about ${coinName} (${coinSymbol}).

Topic: ${topic}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "lesson title (max 50 chars)",
  "content": "educational content (200-300 words, engaging and clear, no markdown)",
  "keyFact": "one interesting key fact about ${coinName} (max 100 chars)",
  "quiz": {
    "question": "a clear quiz question about ${coinName}",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "brief explanation of the correct answer"
  }
}

Make the content accurate, educational and engaging for beginners.
The quiz should test understanding of the lesson content.
Return ONLY the JSON, no other text.`

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      }
    )

    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const lesson = JSON.parse(clean)

    res.status(200).json(lesson)
  } catch (e) {
    console.error('Claude API error:', e)
    res.status(500).json({
      error: 'Failed to generate lesson',
      fallback: true
    })
  }
}
