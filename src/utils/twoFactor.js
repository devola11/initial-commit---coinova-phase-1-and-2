import {
  generateSecret as otplibGenerateSecret,
  generateURI,
  verifySync,
} from 'otplib'
import QRCode from 'qrcode'

export function generateSecret() {
  return otplibGenerateSecret({ length: 20 })
}

export async function generateQRCode(email, secret) {
  const otpauth = generateURI({
    strategy: 'totp',
    issuer: 'Coinova',
    label: email,
    secret,
  })
  return await QRCode.toDataURL(otpauth, {
    width: 240,
    margin: 1,
    color: {
      dark: '#0052FF',
      light: '#FFFFFF',
    },
  })
}

export function verifyCode(token, secret) {
  try {
    const result = verifySync({
      strategy: 'totp',
      token: String(token || '').replace(/\s/g, ''),
      secret,
      epochTolerance: 30,
    })
    return !!result?.valid
  } catch {
    return false
  }
}

export function generateBackupCodes() {
  const codes = []
  for (let i = 0; i < 8; i++) {
    const code =
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    codes.push(code)
  }
  return codes
}
