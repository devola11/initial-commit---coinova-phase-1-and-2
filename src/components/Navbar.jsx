import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalPreferences, { useGlobalPrefs } from './GlobalPreferences'
import AccountToggle from './AccountToggle'
import UserAvatar from './UserAvatar'
import UserDrawer from './UserDrawer'
import { useLanguage } from '../hooks/useLanguage'
import { useCNCToken } from '../hooks/useCNCToken'
import logo from '../assets/logo.jpeg'
import cncLogo from '../assets/cnc-logo-32.png'

const primaryLinkKeys = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/portfolio', key: 'portfolio' },
  { to: '/markets', key: 'markets' },
  { to: '/invest', key: 'invest' },
  { to: '/trending', key: 'trending' },
  { to: '/convert', key: 'convert' },
]

const dropdownItem = {
  display: 'block',
  padding: '12px',
  borderRadius: 8,
  textDecoration: 'none',
  marginBottom: 2,
  transition: 'background 0.15s',
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function EarnDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const closeTimer = useRef(null)
  const location = useLocation()
  const isActive = ['/staking', '/airdrops', '/learn', '/cnc'].includes(location.pathname)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  function handleItemHover(e) {
    e.currentTarget.style.background = '#1E2025'
  }
  function handleItemLeave(e, base) {
    e.currentTarget.style.background = base
  }

  return (
    <div
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      style={{ position: 'relative' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline whitespace-nowrap inline-flex items-center bg-transparent border-none cursor-pointer ${
          isActive || open
            ? 'text-text-primary bg-card-border'
            : 'text-text-muted hover:text-text-primary hover:bg-card-border/50'
        }`}
      >
        Earn
        <span style={{ marginLeft: 4, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 12,
            padding: 8,
            minWidth: 240,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          <Link
            to="/staking"
            onClick={() => setOpen(false)}
            style={dropdownItem}
            onMouseEnter={handleItemHover}
            onMouseLeave={(e) => handleItemLeave(e, 'transparent')}
          >
            <div style={{ color: 'white', fontWeight: 600 }}>Staking</div>
            <div style={{ color: '#8A919E', fontSize: 12 }}>Earn up to 20% APY</div>
          </Link>

          <Link
            to="/airdrops"
            onClick={() => setOpen(false)}
            style={dropdownItem}
            onMouseEnter={handleItemHover}
            onMouseLeave={(e) => handleItemLeave(e, 'transparent')}
          >
            <div style={{ color: 'white', fontWeight: 600 }}>Airdrops</div>
            <div style={{ color: '#8A919E', fontSize: 12 }}>Free crypto rewards</div>
          </Link>

          <Link
            to="/learn"
            onClick={() => setOpen(false)}
            style={dropdownItem}
            onMouseEnter={handleItemHover}
            onMouseLeave={(e) => handleItemLeave(e, 'transparent')}
          >
            <div style={{ color: 'white', fontWeight: 600 }}>Learn & Earn</div>
            <div style={{ color: '#8A919E', fontSize: 12 }}>Learn and get paid in crypto</div>
          </Link>

          <Link
            to="/cnc"
            onClick={() => setOpen(false)}
            style={{
              ...dropdownItem,
              background: '#FFD70010',
              border: '1px solid #FFD700',
              marginTop: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FFD70022')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFD70010')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#FFD700', fontWeight: 700 }}>Coinova Coin (CNC)</span>
              <span
                style={{
                  background: '#FFD700',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                PRESALE
              </span>
            </div>
            <div style={{ color: '#FFD700', fontSize: 12 }}>Buy at $0.05 - 50% discount</div>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const prefs = useGlobalPrefs()
  const { t } = useLanguage()
  const cnc = useCNCToken()

  const primaryLinks = primaryLinkKeys.map((l) => ({
    ...l,
    label: t[l.key] || l.key,
  }))

  return (
    <>
      <style>{`
        @keyframes cnc-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
        }
      `}</style>
      <nav className="sticky top-0 z-50 bg-root-bg/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4 lg:gap-6">
            {/* Logo */}
            <Link
              to={user ? '/dashboard' : '/'}
              className="flex items-center gap-2 no-underline flex-shrink-0"
            >
              <img src={logo} alt="Coinova" className="h-7 rounded" />
              <span className="text-lg font-bold text-text-primary tracking-tight whitespace-nowrap">
                Coinova
              </span>
            </Link>

            {/* Account toggle (XL+) */}
            {user && (
              <div className="hidden xl:block flex-shrink-0">
                <AccountToggle compact />
              </div>
            )}

            {/* Primary nav (desktop) */}
            {user && (
              <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                {primaryLinks.map((link) => {
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline whitespace-nowrap ${
                        isActive
                          ? 'text-text-primary bg-card-border'
                          : 'text-text-muted hover:text-text-primary hover:bg-card-border/50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                <EarnDropdown />
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  {/* Globe / preferences */}
                  <button
                    onClick={() => setPrefsOpen(true)}
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-border/50 bg-transparent border-none cursor-pointer transition-colors"
                    title="Global preferences"
                  >
                    <GlobeIcon />
                  </button>

                  {/* CNC pulsing presale ticker */}
                  <Link
                    to="/cnc"
                    title="Coinova Coin Presale"
                    className="hidden md:inline-flex items-center gap-2 no-underline"
                    style={{
                      background: '#FFD70015',
                      border: '1px solid #FFD700',
                      borderRadius: 8,
                      padding: '6px 12px',
                      animation: 'cnc-glow 3s infinite',
                    }}
                  >
                    <img src={cncLogo} alt="CNC" style={{ width: 18, height: 18 }} className="rounded-full" />
                    <div style={{ lineHeight: 1.1 }}>
                      <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                        CNC PRESALE
                      </div>
                      <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                        ${Number(cnc.price || 0.05).toFixed(2)}
                      </div>
                    </div>
                  </Link>

                  {/* User avatar — replaces hamburger, Settings, Logout, and More */}
                  <UserAvatar onClick={() => setDrawerOpen(true)} />
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary-blue text-white hover:bg-primary-blue-hover transition-colors no-underline"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {user && (
        <UserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}

      {prefsOpen && (
        <GlobalPreferences
          onClose={() => setPrefsOpen(false)}
          country={prefs.country}
          language={prefs.language}
          setCountry={prefs.setCountry}
          setLanguage={prefs.setLanguage}
        />
      )}
    </>
  )
}
