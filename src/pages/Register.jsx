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
  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordValidation = useMemo(
    () => (password ? validatePassword(password) : null),
    [password]
  )
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = !!passwordValidation?.isValid && passwordsMatch && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!passwordValidation?.isValid) {
      setError('Please meet all password requirements')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
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

        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-loss/10 border border-loss/20 text-loss text-sm rounded-lg px-4 py-3">
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
              disabled={!canSubmit}
              className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
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
