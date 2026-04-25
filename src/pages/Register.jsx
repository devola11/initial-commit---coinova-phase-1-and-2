import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { detectAndSaveLocation } from '../hooks/useGeoLocation'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../utils/passwordValidator'
import PasswordStrength from '../components/PasswordStrength'

async function creditCncBonus(userId) {
  const { data: existing } = await supabase
    .from('cnc_holdings')
    .select('quantity')
    .eq('user_id', userId)
    .maybeSingle()
  const newQty = (Number(existing?.quantity) || 0) + 100
  if (existing) {
    await supabase
      .from('cnc_holdings')
      .update({ quantity: newQty })
      .eq('user_id', userId)
  } else {
    await supabase
      .from('cnc_holdings')
      .insert({ user_id: userId, quantity: 100, avg_buy_price: 0 })
  }
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordValidation = useMemo(
    () => (password ? validatePassword(password) : null),
    [password]
  )
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password || !displayName) {
      setError('Please fill in all fields')
      return
    }

    if (!passwordValidation?.isValid) {
      setError(
        'Your password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.'
      )
      document.querySelector('input[type="password"]')?.focus()
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)
    try {
      const regData = await register(email, password, displayName)
      if (regData?.user) {
        detectAndSaveLocation(regData.user.id).catch(() => {})
        creditCncBonus(regData.user.id).catch((err) =>
          console.warn('CNC welcome bonus failed:', err?.message || err)
        )
        setRegisteredEmail(email)
        setShowSuccess(true)
        setLoading(false)
        return
      }
      setError('Registration completed but no user was returned. Please try logging in.')
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-text-muted text-sm">
            Start trading with $10,000 in virtual funds
          </p>
        </div>

        {showSuccess ? (
          <div
            style={{
              background: '#141519',
              border: '1px solid #1E2025',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: '#05B16920',
                border: '2px solid #05B169',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 12px 0' }}>
              Account created successfully!
            </h2>

            <p style={{ color: '#E0E2E6', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px 0' }}>
              We sent a verification email to:
            </p>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
                color: '#0052FF',
                fontWeight: 600,
                fontSize: 15,
                wordBreak: 'break-all',
              }}
            >
              {registeredEmail}
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 20,
                textAlign: 'left',
                marginBottom: 24,
              }}
            >
              <h3 style={{ color: '#FFD700', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>
                Next steps:
              </h3>
              <ol style={{ color: '#E0E2E6', fontSize: 14, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Check your inbox for our verification email</li>
                <li>Click the "Verify my email" button</li>
                <li>You will be redirected back to Coinova</li>
                <li>Start trading with $10,000 demo funds!</li>
              </ol>
            </div>

            <p style={{ color: '#8A919E', fontSize: 13, margin: '0 0 20px 0' }}>
              Did not receive the email? Check your spam folder or wait a few minutes.
            </p>

            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Go to login
            </button>

            <button
              onClick={() => {
                setShowSuccess(false)
                setRegisteredEmail('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setDisplayName('')
                setError('')
              }}
              style={{
                background: 'transparent',
                color: '#8A919E',
                border: 'none',
                marginTop: 12,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Register another account
            </button>
          </div>
        ) : (
        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                style={{
                  padding: 14,
                  marginBottom: 16,
                  background: '#F6465D15',
                  border: '1px solid #F6465D',
                  borderRadius: 10,
                  color: '#F6465D',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Satoshi"
                className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 pr-16 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8A919E',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <PasswordStrength validation={passwordValidation} />

            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <div className="text-[#F6465D] text-xs mt-2">
                  Passwords do not match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#0052FF',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              className="w-full text-white font-semibold py-3 rounded-lg text-sm transition-opacity border-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>
        )}

        <p className="text-center text-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-blue hover:underline no-underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
