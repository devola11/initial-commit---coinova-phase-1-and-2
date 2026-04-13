import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalPreferences, { useGlobalPrefs } from './GlobalPreferences'
import logo from '../assets/logo.jpeg'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/convert', label: 'Convert', icon: 'swap' },
  { to: '/trending', label: 'Trending', icon: 'fire' },
  { to: '/markets', label: 'Markets' },
  { to: '/invest', label: 'Invest' },
  { to: '/airdrops', label: 'Airdrops', icon: 'gift' },
  { to: '/staking', label: 'Staking', icon: 'shield' },
  { to: '/watchlist', label: 'Watchlist', icon: 'star' },
  { to: '/alerts', label: 'Alerts' },
]

function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
  )
}

function FireIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  )
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
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

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const prefs = useGlobalPrefs()

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-root-bg/80 backdrop-blur-xl border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 no-underline">
              <img src={logo} alt="Coinova" className="h-7 rounded" />
              <span className="text-lg font-bold text-text-primary tracking-tight">
                Coinova
              </span>
            </Link>

            {/* Desktop nav links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline flex items-center gap-1.5 ${
                        isActive
                          ? 'text-text-primary bg-card-bg'
                          : 'text-text-muted hover:text-text-primary hover:bg-card-bg/50'
                      }`}
                    >
                      {link.icon === 'gift' && <GiftIcon />}
                      {link.icon === 'swap' && <SwapIcon />}
                      {link.icon === 'fire' && <FireIcon />}
                      {link.icon === 'shield' && <ShieldIcon />}
                      {link.icon === 'star' && <StarNavIcon />}
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    to="/settings"
                    className={`hidden md:inline-flex px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                      location.pathname === '/settings'
                        ? 'text-text-primary bg-card-bg'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => setPrefsOpen(true)}
                    className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-bg/50 bg-transparent border-none cursor-pointer transition-colors"
                    title="Global preferences"
                  >
                    <GlobeIcon />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-flex px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-loss transition-colors bg-transparent border-none cursor-pointer"
                  >
                    Log out
                  </button>
                  {/* Hamburger — mobile only */}
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer gap-1.5"
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
          <div className="md:hidden bg-[#141519] border-t border-card-border">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
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
                Settings
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
                Log out
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
