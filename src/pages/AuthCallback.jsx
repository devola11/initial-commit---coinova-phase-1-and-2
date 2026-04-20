import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpeg'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // PKCE flow: Supabase delivers a ?code=... query param that must be
        // exchanged for a session. detectSessionInUrl handles this on client
        // load, but we call it explicitly so we know when it's done before
        // checking for a session.
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Code exchange error:', error)
            navigate('/login')
            return
          }
        } else {
          // Legacy hash flow fallback for older confirmation links.
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          )
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) {
              console.error('Session error:', error)
              navigate('/login')
              return
            }
          }
        }

        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          console.error('No session:', error)
          navigate('/login')
          return
        }

        navigate('/dashboard')
      } catch (e) {
        console.error('Auth callback error:', e)
        navigate('/login')
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
        Confirming your email...
      </div>
      <div style={{ color: '#8A919E', fontSize: 14 }}>
        Please wait a moment
      </div>
    </div>
  )
}
