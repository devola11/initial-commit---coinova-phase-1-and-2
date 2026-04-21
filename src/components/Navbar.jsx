import { useState } from 'react'
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

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
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
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-1 flex-shrink-0">
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

                  {/* CNC ticker */}
                  <Link
                    to="/cnc"
                    title="Coinova Coin"
                    className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold no-underline hover:bg-card-border/50 transition-colors"
                    style={{
                      color:
                        (Number(cnc.change_24h) || 0) >= 0 ? '#05B169' : '#E53935',
                    }}
                  >
                    <img src={cncLogo} alt="CNC" className="w-5 h-5 rounded-full" />
                    <span className="text-text-primary">CNC</span>
                    <span className="text-text-primary">
                      ${Number(cnc.price || 0).toFixed(2)}
                    </span>
                    <span>
                      {(Number(cnc.change_24h) || 0) >= 0 ? '+' : ''}
                      {Number(cnc.change_24h || 0).toFixed(2)}%
                    </span>
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
