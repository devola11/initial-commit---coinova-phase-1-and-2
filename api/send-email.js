import { Resend } from 'resend'

const ALLOWED_ORIGINS = [
  'https://initial-commit-coinova-phase-1-and.vercel.app',
  'https://cointehera.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
]

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

export default async function handler(req, res) {
  const origin = req.headers.origin || ''

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin',
      'https://cointehera.com')
  }

  res.setHeader('Access-Control-Allow-Methods',
    'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, x-internal-secret')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  const secret = req.headers['x-internal-secret']
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return res.status(403).json({
      error: 'Forbidden'
    })
  }

  const { to, subject, html } = req.body

  if (!to || !subject || !html) {
    return res.status(400).json({
      error: 'Missing required fields'
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return res.status(400).json({
      error: 'Invalid email address'
    })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    return res.status(500).json({
      error: 'Email service not configured'
    })
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
      subject: subject,
      html: html,
      reply_to: 'info@cointehera.com'
    })

    if (error) {
      console.error('Resend error:', JSON.stringify(error))
      return res.status(500).json({
        error: 'Failed to send email'
      })
    }

    return res.status(200).json({
      success: true,
      messageId: data?.id
    })

  } catch(err) {
    console.error('Send email error:', err.message)
    return res.status(500).json({
      error: 'Failed to send email'
    })
  }
}
