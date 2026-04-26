const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY

export async function sendSecurityEmail({
  userEmail,
  userName,
  type,
  details = {},
}) {
  const messages = {
    new_login: {
      subject: 'New login to your Coinova account',
      body: `Hi ${userName},

We detected a new login to your Coinova account.

Time: ${new Date().toLocaleString()}
Browser: ${details.userAgent || 'Unknown'}

If this was you, no action needed.
If this was NOT you, please:
1. Change your password immediately
2. Enable Two-Factor Authentication
3. Contact support at coinovasupport@gmail.com

Coinova Security Team`,
    },
    password_changed: {
      subject: 'Your Coinova password was changed',
      body: `Hi ${userName},

Your password was just changed.

Time: ${new Date().toLocaleString()}

If you did not make this change, contact
coinovasupport@gmail.com immediately.

Coinova Security Team`,
    },
    twofa_enabled: {
      subject: 'Two-Factor Authentication enabled',
      body: `Hi ${userName},

You have successfully enabled 2FA on your account.
Your account is now more secure.

Save your backup codes safely.

Coinova Security Team`,
    },
  }

  const message = messages[type]
  if (!message) return
  if (!WEB3FORMS_KEY) {
    console.warn('VITE_WEB3FORMS_KEY not configured; skipping email')
    return
  }

  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: message.subject,
        from_name: 'Coinova Security',
        email: userEmail,
        message: message.body,
      }),
    })
  } catch (e) {
    console.error('Email send error:', e)
  }
}
