import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpeg'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Confirming your email...')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const query = new URLSearchParams(window.location.search)
        const hash = new URLSearchParams(window.location.hash.substring(1))

        // Error shape Supabase sometimes redirects with: ?error=...&error_description=...
        const errParam = query.get('error') || hash.get('error')
        const errDesc = query.get('error_description') || hash.get('error_description')
        if (errParam) {
          setErrorMsg(errDesc || errParam)
          setTimeout(() => navigate('/login'), 2500)
          return
        }

        // Shape 1 — PKCE flow: ?code=<uuid>
        const code = query.get('code')
        if (code) {
          setStatus('Exchanging authorization code...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // Shape 2 — Token hash / OTP confirm: ?token_hash=&type=signup|email|recovery
        const tokenHash = query.get('token_hash')
        const type = query.get('type')
        if (!code && tokenHash && type) {
          setStatus('Verifying confirmation link...')
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })
          if (error) throw error
        }

        // Shape 3 — Legacy ?token=&type=
        const legacyToken = query.get('token')
        if (!code && !tokenHash && legacyToken && type) {
          setStatus('Verifying token...')
          const { error } = await supabase.auth.verifyOtp({
            token: legacyToken,
            type,
          })
          if (error) throw error
        }

        // Shape 4 — Hash fragment with access/refresh tokens (implicit flow)
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')
        if (!code && !tokenHash && !legacyToken && accessToken && refreshToken) {
          setStatus('Restoring session...')
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        }

        // Verify we actually have a session before leaving the page
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          throw error || new Error('No session established')
        }

        // Clear the auth params from the URL before navigating away
        window.history.replaceState({}, '', window.location.pathname)
        navigate('/dashboard')
      } catch (e) {
        console.error('Auth callback error:', e)
        setErrorMsg(e?.message || 'Confirmation failed')
        setTimeout(() => navigate('/login'), 2500)
      }
    }

    const timer = setTimeout(handleAuth, 500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0B0D',
        color: '#fff',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
      }}
    >
      <img
        src={logo}
        alt="Coinova"
        style={{ width: 64, height: 64, borderRadius: 12 }}
      />
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        {errorMsg ? 'Confirmation failed' : status}
      </div>
      <div style={{ color: errorMsg ? '#F6465D' : '#8A919E', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        {errorMsg ? errorMsg : 'Please wait a moment'}
      </div>
    </div>
  )
}
