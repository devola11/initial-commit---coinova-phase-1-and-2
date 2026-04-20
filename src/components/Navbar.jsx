import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalPreferences, { useGlobalPrefs } from './GlobalPreferences'
import AccountToggle from './AccountToggle'
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

const moreLinkKeys = [
  { to: '/analytics', key: 'analytics', icon: 'chart' },
  { to: '/learn', key: 'learn', icon: 'book' },
  { to: '/staking', key: 'staking', icon: 'shield' },
  { to: '/airdrops', key: 'airdrops', icon: 'gift' },
  { to: '/watchlist', key: 'watchlist', icon: 'star' },
  { to: '/alerts', key: 'alerts', icon: 'bell' },
]

function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
  )
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )
}

function StarNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  )
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  )
}

function DropdownIcon({ icon }) {
  if (icon === 'chart') return <ChartIcon />
  if (icon === 'book') return <BookIcon />
  if (icon === 'shield') return <ShieldIcon />
  if (icon === 'gift') return <GiftIcon />
  if (icon === 'star') return <StarNavIcon />
  if (icon === 'bell') return <BellIcon />
  return null
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const prefs = useGlobalPrefs()
  const { t } = useLanguage()
  const cnc = useCNCToken()
  const moreRef = useRef(null)

  // Build translated link arrays
  const primaryLinks = primaryLinkKeys.map((l) => ({ ...l, label: t[l.key] || l.key }))
  const moreLinks = moreLinkKeys.map((l) => ({ ...l, label: t[l.key] || l.key }))
  const allLinks = [...primaryLinks, ...moreLinks]

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close "More" on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    setMenuOpen(false)
    setMoreOpen(false)
    await logout()
    navigate('/')
  }

  const moreHasActive = moreLinks.some((l) => location.pathname === l.to)

  return (
    <>
      <nav className="sticky top-0 z-50 bg-root-bg/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            {/* LEFT - Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 no-underline flex-shrink-0">
              <img src={logo} alt="Coinova" className="h-7 rounded" />
              <span className="text-lg font-bold text-text-primary tracking-tight whitespace-nowrap">
                Coinova
              </span>
            </Link>

            {/* Account mode toggle (desktop) - right after logo */}
            {user && (
              <div className="hidden xl:block flex-shrink-0">
                <AccountToggle compact />
              </div>
            )}

            {/* CENTER - Primary nav (desktop) */}
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* RIGHT - Secondary actions (desktop) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {user ? (
                <>
                  {/* More dropdown */}
                  <div ref={moreRef} className="relative hidden lg:block">
                    <button
                      onClick={() => setMoreOpen(!moreOpen)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap ${
                        moreHasActive || moreOpen
                          ? 'text-text-primary bg-card-border'
                          : 'text-text-muted hover:text-text-primary hover:bg-card-border/50'
                      }`}
                    >
                      {t.more}
                      <ChevronDownIcon />
                    </button>
                    {moreOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-card-bg border border-card-border rounded-xl p-2 min-w-[180px] shadow-xl">
                        {moreLinks.map((link) => {
                          const isActive = location.pathname === link.to
                          return (
                            <Link
                              key={link.to}
                              to={link.to}
                              onClick={() => setMoreOpen(false)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm no-underline transition-colors ${
                                isActive
                                  ? 'text-primary-blue font-medium'
                                  : 'text-text-muted hover:text-text-primary hover:bg-card-border'
                              }`}
                            >
                              <DropdownIcon icon={link.icon} />
                              {link.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Globe / preferences */}
                  <button
                    onClick={() => setPrefsOpen(true)}
                    className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-border/50 bg-transparent border-none cursor-pointer transition-colors"
                    title="Global preferences"
                  >
                    <GlobeIcon />
                  </button>

                  {/* CNC price ticker */}
                  <Link
                    to="/cnc"
                    title="Coinova Coin"
                    className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold no-underline hover:bg-card-border/50 transition-colors"
                    style={{ color: (Number(cnc.change_24h) || 0) >= 0 ? '#05B169' : '#E53935' }}
                  >
                    <img src={cncLogo} alt="CNC" className="w-5 h-5 rounded-full" />
                    <span className="text-text-primary">CNC</span>
                    <span className="text-text-primary">${Number(cnc.price || 0).toFixed(2)}</span>
                    <span>
                      {(Number(cnc.change_24h) || 0) >= 0 ? '+' : ''}
                      {Number(cnc.change_24h || 0).toFixed(2)}%
                    </span>
                  </Link>

                  {/* Settings */}
                  <Link
                    to="/settings"
                    className={`hidden lg:inline-flex px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline whitespace-nowrap ${
                      location.pathname === '/settings'
                        ? 'text-text-primary bg-card-border'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {t.settings}
                  </Link>

                  {/* Log out */}
                  <button
                    onClick={handleLogout}
                    className="hidden lg:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-loss transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap"
                  >
                    {t.logout}
                  </button>

                  {/* Hamburger - mobile only */}
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer gap-1.5"
                    aria-label="Toggle menu"
                  >
                    <span className={`block w-5 h-0.5 bg-text-primary transition-transform duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-text-primary transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-text-primary transition-transform duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
                  </button>
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

        {/* Mobile dropdown menu */}
        {user && menuOpen && (
          <div className="lg:hidden bg-card-bg border-t border-card-border max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              <div className="mb-3 flex justify-center">
                <AccountToggle />
              </div>
              {allLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors no-underline ${
                      isActive
                        ? 'text-text-primary bg-card-bg'
                        : 'text-text-muted hover:text-text-primary hover:bg-card-bg/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors no-underline ${
                  location.pathname === '/settings'
                    ? 'text-text-primary bg-card-bg'
                    : 'text-text-muted hover:text-text-primary hover:bg-card-bg/50'
                }`}
              >
                {t.settings}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); setPrefsOpen(true) }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-card-bg/50 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2"
              >
                <GlobeIcon /> Preferences
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-loss transition-colors bg-transparent border-none cursor-pointer"
              >
                {t.logout}
              </button>
            </div>
          </div>
        )}
      </nav>

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
