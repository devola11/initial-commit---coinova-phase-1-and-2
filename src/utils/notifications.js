function getEmailTemplate({ userName, title, body, ctaText, ctaLink }) {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0B0D; color: #FFFFFF;">
  <div style="padding: 32px; text-align: center; background: #141519; border-bottom: 1px solid #1E2025;">
    <div style="background: #0052FF; width: 48px; height: 48px; border-radius: 12px; display: inline-block; line-height: 48px; font-size: 24px; font-weight: 700; color: white;">C</div>
    <h1 style="color: #FFFFFF; font-size: 24px; margin: 16px 0 0 0;">Cointehera</h1>
  </div>

  <div style="padding: 40px 32px; background: #141519;">
    <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">
      ${title}
    </h2>

    <p style="color: #E0E2E6; font-size: 15px; line-height: 1.6;">
      Hi ${userName},
    </p>

    <div style="color: #E0E2E6; font-size: 15px; line-height: 1.8; white-space: pre-line; margin: 16px 0;">
${body}
    </div>

    ${
      ctaText && ctaLink
        ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaLink}" style="background: #0052FF; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        ${ctaText}
      </a>
    </div>
    `
        : ''
    }

    <p style="color: #8A919E; font-size: 13px; margin-top: 32px;">
      Questions? Contact us at
      <a href="mailto:coinovasupport@gmail.com" style="color: #4a9aff;">coinovasupport@gmail.com</a>
    </p>
  </div>

  <div style="padding: 24px 32px; background: #0A0B0D; text-align: center; border-top: 1px solid #1E2025;">
    <p style="color: #5B616E; font-size: 11px; margin: 0;">
      &copy; 2026 Cointehera. Trade Crypto. Build Wealth.
    </p>
  </div>
</div>
  `
}

export async function sendSecurityEmail({
  userEmail,
  userName,
  type,
  details = {},
}) {
  if (!userEmail) {
    return null
  }

  let locationInfo = 'Unknown location'
  if (type === 'new_login') {
    try {
      const geoRes = await fetch('https://ipapi.co/json/')
      if (geoRes.ok) {
        const geo = await geoRes.json()
        if (geo.city && geo.country_name) {
          locationInfo = `${geo.city}, ${geo.country_name}`
        } else if (geo.country_name) {
          locationInfo = geo.country_name
        }
      }
    } catch {
      locationInfo = 'Unknown location'
    }
  }

  const deviceLabel = details.userAgent
    ? details.userAgent.split('(')[0].trim()
    : 'Unknown device'

  const templates = {
    new_login: {
      subject: 'New login to your Cointehera account',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: 'New Login Detected',
        body: `We detected a new login to your Cointehera account.

Time: ${new Date().toLocaleString()}
Location: ${locationInfo}
Device: ${deviceLabel}
Browser: ${details.userAgent || 'Unknown'}

If this was you, no action needed.

If this was NOT you:
1. Change your password immediately
2. Enable Two-Factor Authentication
3. Contact support immediately`,
        ctaText: 'Secure my account',
        ctaLink: 'https://initial-commit-coinova-phase-1-and.vercel.app/settings',
      }),
    },
    password_changed: {
      subject: 'Your Cointehera password was changed',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: 'Password Changed',
        body: `Your Cointehera password was just changed successfully.

Time: ${new Date().toLocaleString()}

If you did not make this change, contact us immediately at coinovasupport@gmail.com`,
      }),
    },
    twofa_enabled: {
      subject: 'Two-Factor Authentication enabled on Cointehera',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: '2FA Enabled',
        body: `You successfully enabled Two-Factor Authentication on your Cointehera account.

Your account is now significantly more secure.

Make sure to save your backup codes safely.`,
      }),
    },
    withdrawal_received: {
      subject: 'Withdrawal request received - Cointehera',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: 'Withdrawal Received',
        body: `Your withdrawal request has been received and is being processed.

Request ID: ${details.requestNumber || 'N/A'}
Amount: ${details.amount || 'N/A'} ${details.symbol || ''}
Destination: ${details.destination || 'N/A'}

Processing time: Up to 24 hours
You will receive another email when complete.`,
      }),
    },
    withdrawal_completed: {
      subject: 'Withdrawal completed - Cointehera',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: 'Withdrawal Complete',
        body: `Your withdrawal has been processed successfully!

Request ID: ${details.requestNumber || 'N/A'}
Amount: ${details.amount || 'N/A'} ${details.symbol || ''}
Destination: ${details.destination || 'N/A'}
TX Hash: ${details.txHash || 'See dashboard'}

Funds have been sent to your wallet.`,
      }),
    },
    withdrawal_rejected: {
      subject: 'Withdrawal update - Cointehera',
      html: getEmailTemplate({
        userName: userName || 'there',
        title: 'Withdrawal Update',
        body: `Your withdrawal request has been reviewed.

Request ID: ${details.requestNumber || 'N/A'}
Status: Rejected

Reason: ${details.reason || 'Please contact support'}

Your funds have been returned to your Cointehera wallet.

Contact coinovasupport@gmail.com for more information.`,
      }),
    },
  }

  const template = templates[type]
  if (!template) {
    return null
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': import.meta.env.VITE_INTERNAL_SECRET || '',
      },
      body: JSON.stringify({
        to: userEmail,
        subject: template.subject,
        html: template.html,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Email send failed:', data)
      return null
    }

    return data
  } catch (e) {
    console.error('Email send error:', e?.message || e)
    return null
  }
}
