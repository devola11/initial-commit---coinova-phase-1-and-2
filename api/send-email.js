import { Resend } from 'resend'

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

  const body = req.body || {}
  const to = typeof body.to === 'string' ? body.to.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const html = typeof body.html === 'string' ? body.html : ''

  if (!to) {
    return res.status(400).json({ error: 'Missing recipient (to)' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email format' })
  }
  if (!subject) {
    return res.status(400).json({ error: 'Missing subject' })
  }
  if (!html) {
    return res.status(400).json({ error: 'Missing html body' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  const verified = process.env.RESEND_DOMAIN_VERIFIED === 'true'
  const sender = verified
    ? 'Cointehera <noreply@cointehera.com>'
    : 'Cointehera <onboarding@resend.dev>'

  try {
    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', JSON.stringify(error, null, 2))
      return res.status(502).json({
        error: error.message || 'Email provider rejected the request',
        name: error.name,
        statusCode: error.statusCode,
      })
    }

    return res.status(200).json({
      success: true,
      messageId: data?.id,
    })
  } catch (err) {
    console.error('Email send exception:', err)
    return res.status(500).json({
      error: err?.message || 'Unknown server error',
    })
  }
}
