import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { verifyCode } from '../utils/twoFactor'
import { logActivity } from '../utils/activityLogger'
import { sendSecurityEmail } from '../utils/notifications'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show2FAPrompt, setShow2FAPrompt] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaLoading, setTfaLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function finalizeLogin(loggedInUser) {
    logActivity({
      userId: loggedInUser.id,
      action: 'login_success',
      description: 'Logged in successfully',
    })
    sendSecurityEmail({
      userEmail: loggedInUser.email,
      userName:
        loggedInUser.user_metadata?.display_name || loggedInUser.email,
      type: 'new_login',
      details: { userAgent: navigator.userAgent },
    })
    navigate('/dashboard')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      const loggedInUser = data?.user
      if (!loggedInUser) throw new Error('Login failed')

      const { data: tfaData } = await supabase
        .from('user_2fa')
        .select('enabled')
        .eq('user_id', loggedInUser.id)
        .maybeSingle()

      if (tfaData?.enabled) {
        setPendingUser(loggedInUser)
        setShow2FAPrompt(true)
        setLoading(false)
        return
      }

      finalizeLogin(loggedInUser)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault()
    if (!pendingUser) return
    setError('')
    setTfaLoading(true)
    try {
      const { data: tfaSecret } = await supabase
        .from('user_2fa')
        .select('secret, backup_codes')
        .eq('user_id', pendingUser.id)
        .single()

      const totpOk = tfaSecret?.secret
        ? verifyCode(tfaCode, tfaSecret.secret)
        : false
      const backupOk =
        Array.isArray(tfaSecret?.backup_codes) &&
        tfaSecret.backup_codes.includes(tfaCode.trim().toUpperCase())

      if (totpOk || backupOk) {
        finalizeLogin(pendingUser)
      } else {
        setError('Invalid 2FA code')
      }
    } finally {
      setTfaLoading(false)
    }
  }

  if (show2FAPrompt) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-blue mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
              Two-factor verification
            </h1>
            <p className="text-text-muted text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <form onSubmit={handleVerify2FA} className="space-y-4">
              {error && (
                <div className="bg-loss/10 border border-loss/20 text-loss text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              <input
                type="text"
                value={tfaCode}
                onChange={(e) => setTfaCode(e.target.value)}
                placeholder="Enter 6-digit 2FA code"
                maxLength={9}
                autoFocus
                className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-center text-lg text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors tracking-widest"
              />
              <button
                type="submit"
                disabled={tfaLoading || tfaCode.length < 6}
                className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {tfaLoading ? 'Verifying...' : 'Verify and continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShow2FAPrompt(false)
                  setPendingUser(null)
                  setTfaCode('')
                  setError('')
                }}
                className="w-full bg-transparent border border-card-border text-text-muted hover:text-text-primary font-semibold py-3 rounded-lg text-sm cursor-pointer"
              >
                Cancel
              </button>
            </form>
            <p className="text-center text-text-muted text-xs mt-4">
              Lost access? Use one of your backup codes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-text-muted text-sm">
            Sign in to your Coinova account
          </p>
        </div>

        {/* Form card */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-loss/10 border border-loss/20 text-loss text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs uppercase tracking-widest text-text-muted font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-text-muted hover:text-primary-blue text-xs no-underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary-blue hover:underline no-underline font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
