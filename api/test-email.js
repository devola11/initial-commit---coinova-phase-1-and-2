import { Resend } from 'resend'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const apiKey = process.env.RESEND_API_KEY
  const verified = process.env.RESEND_DOMAIN_VERIFIED === 'true'

  if (!apiKey) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'RESEND_API_KEY not found'
    })
  }

  try {
    const resend = new Resend(apiKey)

    const sender = verified
      ? 'Cointehera <noreply@cointehera.com>'
      : 'Cointehera <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from: sender,
      to: ['coinovasupport@gmail.com'],
      subject: 'Cointehera Email Test',
      html: `
        <h2>Email test successful!</h2>
        <p>Sender: ${sender}</p>
        <p>Domain verified: ${verified}</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    })

    if (error) {
      return res.status(200).json({
        status: 'ERROR',
        sender,
        verified,
        error: error
      })
    }

    return res.status(200).json({
      status: 'OK',
      sender,
      verified,
      messageId: data?.id,
      message: 'Test email sent to coinovasupport@gmail.com'
    })

  } catch(err) {
    return res.status(200).json({
      status: 'ERROR',
      error: err.message
    })
  }
}
