import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  generateSecret,
  generateQRCode,
  verifyCode,
  generateBackupCodes,
} from '../utils/twoFactor'
import { sendSecurityEmail } from '../utils/notifications'

export default function TwoFactorSetup({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initialize2FA()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initialize2FA = async () => {
    const newSecret = generateSecret()
    setSecret(newSecret)
    const qr = await generateQRCode(user.email, newSecret)
    setQrCode(qr)
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)

    if (!verifyCode(code, secret)) {
      setError('Invalid code. Please try again.')
      setLoading(false)
      return
    }

    const codes = generateBackupCodes()
    setBackupCodes(codes)

    const { error: dbError } = await supabase
      .from('user_2fa')
      .upsert({
        user_id: user.id,
        enabled: true,
        secret: secret,
        backup_codes: codes,
        enabled_at: new Date().toISOString(),
      })

    if (dbError) {
      setError('Failed to save. Try again.')
      setLoading(false)
      return
    }

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'two_factor_enabled',
      description: 'Two-factor authentication enabled',
    })

    sendSecurityEmail({
      userEmail: user.email,
      userName: user.user_metadata?.display_name || user.email,
      type: 'twofa_enabled',
    })

    setStep(3)
    setLoading(false)
  }

  const handleFinish = () => {
    onSuccess && onSuccess()
    onClose()
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ color: '#fff', margin: '0 0 8px 0' }}>
          {step === 1 && 'Enable Two-Factor Authentication'}
          {step === 2 && 'Verify Your Code'}
          {step === 3 && 'Save Your Backup Codes'}
        </h2>
        <p style={{ color: '#8A919E', fontSize: 13, marginBottom: 24 }}>
          {step === 1 && 'Scan the QR code with your authenticator app'}
          {step === 2 && 'Enter the 6-digit code from your app'}
          {step === 3 && 'Store these codes safely - they cannot be recovered'}
        </p>

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 12,
                    background: 'white',
                    padding: 12,
                  }}
                />
              )}
            </div>
            <div style={{ marginBottom: 16, fontSize: 13, color: '#8A919E' }}>
              Recommended apps:
            </div>
            <ul
              style={{
                color: '#E0E2E6',
                fontSize: 13,
                paddingLeft: 20,
                marginBottom: 24,
              }}
            >
              <li>Google Authenticator</li>
              <li>Authy</li>
              <li>Microsoft Authenticator</li>
            </ul>
            <div
              style={{
                background: '#0A0B0D',
                padding: 12,
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 11, color: '#8A919E', marginBottom: 4 }}>
                Cannot scan? Enter this code manually:
              </div>
              <div
                style={{
                  color: '#FFD700',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  fontSize: 13,
                }}
              >
                {secret}
              </div>
            </div>
            <button onClick={() => setStep(2)} style={primaryBtn}>
              Next: Verify Code
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: 16,
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                color: '#FFD700',
                fontSize: 24,
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ color: '#F6465D', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              style={{
                ...primaryBtn,
                opacity: loading || code.length !== 6 ? 0.5 : 1,
                cursor:
                  loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div
              style={{
                background: '#F59E0B20',
                border: '1px solid #F59E0B',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: '#F59E0B',
                fontSize: 13,
              }}
            >
              Save these codes! Use them if you lose access to your authenticator.
            </div>
            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                fontFamily: 'monospace',
              }}
            >
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    color: '#fff',
                    padding: '6px 0',
                    fontSize: 14,
                    borderBottom: i < 7 ? '1px solid #1E2025' : 'none',
                  }}
                >
                  {i + 1}. {c}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'))
                alert('Codes copied!')
              }}
              style={{
                ...primaryBtn,
                background: '#1E2025',
                marginBottom: 8,
              }}
            >
              Copy backup codes
            </button>
            <button onClick={handleFinish} style={primaryBtn}>
              I have saved my codes
            </button>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#8A919E',
            border: 'none',
            marginTop: 12,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 20,
}

const modalStyle = {
  background: '#141519',
  border: '1px solid #1E2025',
  borderRadius: 16,
  padding: 32,
  maxWidth: 440,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const primaryBtn = {
  width: '100%',
  padding: 14,
  background: '#0052FF',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}
