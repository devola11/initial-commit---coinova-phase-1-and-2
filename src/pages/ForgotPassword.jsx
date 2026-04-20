import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendReset(addr) {
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(addr, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset link')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    sendReset(email.trim())
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary-blue mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
            Reset your password
          </h1>
          <p className="text-text-muted text-sm">
            Enter your email and we will send you a reset link
          </p>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-profit/20 mx-auto mb-4 flex items-center justify-center text-2xl text-profit">
                ✓
              </div>
              <div className="text-text-primary font-semibold text-lg mb-2">
                Check your email!
              </div>
              <div className="text-text-muted text-sm mb-5">
                We sent a password reset link to{' '}
                <span className="text-text-primary font-medium">{email}</span>
              </div>
              <div className="text-text-muted text-xs mb-4">
                Didn&apos;t receive it? Check your spam folder.
              </div>
              <button
                onClick={() => sendReset(email)}
                disabled={loading}
                className="text-primary-blue text-sm font-semibold bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50"
              >
                {loading ? 'Resending...' : 'Resend email'}
              </button>
              {error && (
                <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                  {error}
                </div>
              )}
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
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          Remembered your password?{' '}
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
