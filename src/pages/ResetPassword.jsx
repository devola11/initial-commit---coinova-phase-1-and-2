import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../utils/passwordValidator'
import PasswordStrength from '../components/PasswordStrength'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const pwValidation = useMemo(
    () => (password ? validatePassword(password) : null),
    [password]
  )
  const pwMatches = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = !!pwValidation?.isValid && pwMatches && !saving

  useEffect(() => {
    let cancelled = false

    async function establishSession() {
      try {
        const code = searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) throw error
          }
        }

        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session) {
          setTokenValid(true)
          window.history.replaceState({}, '', '/reset-password')
        } else {
          setTokenValid(false)
        }
      } catch (e) {
        console.error('Reset password session error:', e)
        if (!cancelled) setTokenValid(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    // Small delay so the Supabase SDK's own detectSessionInUrl has a chance
    // to run before we call getSession.
    const t = setTimeout(establishSession, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!pwValidation?.isValid) {
      setError('Please meet all password requirements')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
            Set a new password
          </h1>
          <p className="text-text-muted text-sm">
            Choose a strong password for your Coinova account
          </p>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          {checking ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full border-[3px] border-[#1E2025] border-t-[#0052FF] animate-spin" />
              <div className="text-text-muted text-sm">Verifying reset link...</div>
            </div>
          ) : !tokenValid ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-loss/20 mx-auto mb-4 flex items-center justify-center text-2xl text-loss">
                !
              </div>
              <div className="text-text-primary font-semibold text-lg mb-2">
                This reset link has expired
              </div>
              <div className="text-text-muted text-sm mb-5">
                Reset links expire after 1 hour. Please request a new one.
              </div>
              <Link
                to="/forgot-password"
                className="inline-block w-full py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold no-underline transition-colors"
              >
                Request new link
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-profit/20 mx-auto mb-4 flex items-center justify-center text-2xl text-profit">
                ✓
              </div>
              <div className="text-text-primary font-semibold text-lg mb-2">
                Password updated!
              </div>
              <div className="text-text-muted text-sm">
                Taking you to your dashboard...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-loss/10 border border-loss/20 text-loss text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                  New password
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

              <PasswordStrength validation={pwValidation} />

              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
                  Confirm new password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
                />
                {confirmPassword.length > 0 && !pwMatches && (
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
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          <Link
            to="/login"
            className="text-primary-blue hover:underline no-underline font-medium"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
