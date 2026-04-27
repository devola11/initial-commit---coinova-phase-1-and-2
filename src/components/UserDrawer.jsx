import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../hooks/useWallet'
import { ADMIN_EMAIL } from '../pages/Admin'
import UserAvatar from './UserAvatar'
import AccountToggle from './AccountToggle'
import logo from '../assets/logo.jpeg'

const BASE_SECTIONS = [
  {
    title: 'TRADING',
    links: [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Portfolio', path: '/portfolio' },
      { name: 'Markets', path: '/markets' },
      { name: 'Invest', path: '/invest' },
      { name: 'Convert', path: '/convert' },
      { name: 'Trending', path: '/trending' },
    ],
  },
  {
    title: 'EARN',
    links: [
      { name: 'Staking', path: '/staking' },
      { name: 'Airdrops', path: '/airdrops' },
      { name: 'Learn & Earn', path: '/learn' },
      { name: 'Coinova Coin (CNC)', path: '/cnc' },
    ],
  },
  {
    title: 'MANAGE',
    links: [
      { name: 'Watchlist', path: '/watchlist' },
      { name: 'Analytics', path: '/analytics' },
      { name: 'Alerts', path: '/alerts' },
    ],
  },
  {
    title: 'ACCOUNT',
    links: [
      { name: 'My Tickets', path: '/my-tickets' },
      { name: 'My Withdrawals', path: '/my-withdrawals' },
      { name: 'Settings', path: '/settings' },
      { name: 'KYC Verification', path: '/kyc' },
      { name: 'Account Activity', path: '/security/activity' },
    ],
  },
]

export default function UserDrawer({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const wallet = useWallet()

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const displayName = user?.user_metadata?.display_name || 'Coinova User'

  const sections = BASE_SECTIONS.map((s) => ({
    ...s,
    links: [...s.links],
  }))
  if (isAdmin) {
    sections[3].links.push({ name: 'Admin Dashboard', path: '/admin' })
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleSignOut() {
    try {
      await logout()
    } catch (e) {
      console.error('Logout failed:', e)
    }
    onClose()
    navigate('/login')
  }

  function handleNav(path) {
    onClose()
    navigate(path)
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 400,
          background: '#0A0B0D',
          zIndex: 9999,
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E2025',
            position: 'sticky',
            top: 0,
            background: '#0A0B0D',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Coinova" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Coinova</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: '#141519',
              border: '1px solid #1E2025',
              color: '#8A919E',
              width: 36,
              height: 36,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '24px 20px',
            background: '#141519',
            borderBottom: '1px solid #1E2025',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <UserAvatar size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  color: '#8A919E',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleNav('/settings')}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid #1E2025',
              borderRadius: 8,
              color: '#8A919E',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View profile settings
          </button>
        </div>

        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            borderBottom: '1px solid #1E2025',
          }}
        >
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid #F59E0B',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                color: '#F59E0B',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Demo Account
            </div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              ${(wallet?.balance || 0).toFixed(2)}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 82, 255, 0.08)',
              border: '1px solid #0052FF',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                color: '#0052FF',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Main Wallet
            </div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              ${(wallet?.walletBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1E2025',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <AccountToggle />
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>
          {sections.map((section, si) => (
            <div
              key={section.title}
              style={{
                padding: '16px 0',
                borderBottom: si < sections.length - 1 ? '1px solid #1E2025' : 'none',
              }}
            >
              <div
                style={{
                  padding: '0 20px 8px',
                  color: '#5B616E',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '1px',
                }}
              >
                {section.title}
              </div>
              {section.links.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: isActive ? 'rgba(0, 82, 255, 0.12)' : 'transparent',
                      border: 'none',
                      color: isActive ? '#fff' : '#8A919E',
                      fontSize: 15,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      borderLeft: isActive ? '3px solid #0052FF' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#141519'
                        e.currentTarget.style.color = '#fff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#8A919E'
                      }
                    }}
                  >
                    {link.name}
                    <span style={{ marginLeft: 'auto', color: '#5B616E', fontSize: 14 }}>›</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: 20, borderTop: '1px solid #1E2025', background: '#0A0B0D' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(246, 70, 93, 0.12)',
              border: '1px solid #F6465D',
              borderRadius: 10,
              color: '#F6465D',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', color: '#5B616E', fontSize: 11 }}>
            © 2026 Coinova. v1.0.0
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
