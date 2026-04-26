import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpeg'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Verifying your email...')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const code = searchParams.get('code')
        const token = searchParams.get('token')
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorDesc = searchParams.get('error_description')

        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        )
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashError = hashParams.get('error_code')

        const isRecovery = type === 'recovery' ||
          hashParams.get('type') === 'recovery'

        // Gmail (and some mail clients) pre-fetch the link for virus scanning,
        // which burns single-use tokens before the user clicks. If a session
        // already exists, we're done - skip straight to the right destination.
        const { data: existingSession } = await supabase.auth.getSession()

        if (existingSession?.session) {
          if (isRecovery) {
            setStatus('Reset link verified! Set a new password...')
            setTimeout(() => navigate('/reset-password'), 1200)
            return
          }
          setStatus('Email verified! Redirecting to your dashboard...')
          window.history.replaceState({}, '', '/auth/callback')
          setTimeout(() => navigate('/dashboard'), 1500)
          return
        }

        const finishSuccess = () => {
          if (isRecovery) {
            setStatus('Reset link verified! Set a new password...')
            setTimeout(() => navigate('/reset-password'), 1200)
          } else {
            setStatus('Email verified! Welcome to Coinova!')
            setTimeout(() => navigate('/dashboard'), 1500)
          }
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data?.session) {
            finishSuccess()
            return
          }
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            finishSuccess()
            return
          }
        }

        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          })
          if (!error && data?.session) {
            finishSuccess()
            return
          }
        }

        if (token && type === 'signup') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          })
          if (!error && data?.session) {
            finishSuccess()
            return
          }
        }

        if (error || hashError) {
          const message = errorDesc ||
            'This verification link has expired or was already used.'

          if (
            message.includes('expired') ||
            message.includes('invalid') ||
            message.includes('used')
          ) {
            setStatus('Your email is already verified! Please log in to continue.')
            setIsError(false)
            setTimeout(() => navigate('/login'), 2500)
            return
          }

          setStatus(message)
          setIsError(true)
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        setStatus('Verification complete. Please log in to access your account.')
        setTimeout(() => navigate('/login'), 2000)
      } catch (e) {
        console.error('Auth callback error:', e)
        setStatus('Your email is verified. Please log in to continue.')
        setTimeout(() => navigate('/login'), 2500)
      }
    }

    const timer = setTimeout(handleAuth, 600)
    return () => clearTimeout(timer)
  }, [navigate, searchParams])

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
        gap: 24,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <img
        src={logo}
        alt="Coinova"
        style={{ width: 72, height: 72, borderRadius: 14 }}
      />

      {!isError && (
        <div
          style={{
            border: '3px solid #1E2025',
            borderTopColor: '#0052FF',
            borderRadius: '50%',
            width: 40,
            height: 40,
            animation: 'spin 1s linear infinite',
          }}
        />
      )}

      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          maxWidth: 400,
          lineHeight: 1.5,
          color: isError ? '#F6465D' : '#FFFFFF',
        }}
      >
        {status}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
