function getEmailTemplate({ userName, title, body, ctaText, ctaLink }) {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0B0D; color: #FFFFFF;">
  <div style="padding: 32px; text-align: center; background: #141519; border-bottom: 1px solid #1E2025;">
    <div style="background: #0052FF; width: 48px; height: 48px; border-radius: 12px; display: inline-block; line-height: 48px; font-size: 24px; font-weight: 700;">C</div>
    <h1 style="color: #FFFFFF; font-size: 24px; margin: 16px 0 0 0;">Coinova</h1>
  </div>

  <div style="padding: 40px 32px; background: #141519;">
    <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">
      ${title}
    </h2>

    <p style="color: #E0E2E6; font-size: 15px; line-height: 1.6;">
      Hi ${userName || 'there'},
    </p>

    <div style="color: #E0E2E6; font-size: 15px; line-height: 1.6; white-space: pre-line;">
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
      Questions? Reply to this email or contact
      <a href="mailto:coinovasupport@gmail.com" style="color: #4a9aff;">coinovasupport@gmail.com</a>
    </p>
  </div>

  <div style="padding: 24px 32px; background: #0A0B0D; text-align: center;">
    <p style="color: #5B616E; font-size: 11px;">
      &copy; 2026 Coinova. Trade Crypto. Build Wealth.
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
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''

  const templates = {
    new_login: {
      subject: 'New login to your Coinova account',
      html: getEmailTemplate({
        userName,
        title: 'New Login Detected',
        body: `We detected a new login to your Coinova account.

Time: ${new Date().toLocaleString()}
Browser: ${details.userAgent || 'Unknown device'}

If this was you, no action needed.

If this was NOT you:
1. Change your password immediately
2. Enable Two-Factor Authentication
3. Contact support immediately`,
        ctaText: 'Secure my account',
        ctaLink: origin + '/settings',
      }),
    },
    password_changed: {
      subject: 'Your Coinova password was changed',
      html: getEmailTemplate({
        userName,
        title: 'Password Changed',
        body: `Your Coinova password was just changed.

Time: ${new Date().toLocaleString()}

If you did not make this change, contact us immediately.`,
      }),
    },
    twofa_enabled: {
      subject: 'Two-Factor Authentication enabled',
      html: getEmailTemplate({
        userName,
        title: '2FA Enabled',
        body: `You successfully enabled Two-Factor Authentication.

Your account is now significantly more secure.

Make sure to save your backup codes safely.`,
      }),
    },
    withdrawal_received: {
      subject: 'Withdrawal request received',
      html: getEmailTemplate({
        userName,
        title: 'Withdrawal Received',
        body: `Your withdrawal request has been received and is being processed.

Request ID: ${details.requestNumber}
Amount: ${details.amount} ${details.symbol}
Destination: ${details.destination}

Status: Under review
Processing time: Up to 24 hours

You will receive another email when complete.`,
      }),
    },
    withdrawal_completed: {
      subject: 'Withdrawal completed!',
      html: getEmailTemplate({
        userName,
        title: 'Withdrawal Complete',
        body: `Your withdrawal has been processed successfully!

Request ID: ${details.requestNumber}
Amount: ${details.amount} ${details.symbol}
Destination: ${details.destination}
TX Hash: ${details.txHash || 'Available in your dashboard'}

Funds have been sent to your wallet.`,
      }),
    },
    withdrawal_rejected: {
      subject: 'Withdrawal request rejected',
      html: getEmailTemplate({
        userName,
        title: 'Withdrawal Rejected',
        body: `Your withdrawal request has been rejected.

Request ID: ${details.requestNumber}
Amount: ${details.amount} ${details.symbol}
Reason: ${details.reason || 'Not specified'}

Your balance has been refunded. Please contact support if you have questions.`,
      }),
    },
  }

  const template = templates[type]
  if (!template) {
    console.error('Unknown email type:', type)
    return
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        type,
      }),
    })

    return await response.json()
  } catch (e) {
    console.error('Email error:', e)
  }
}
