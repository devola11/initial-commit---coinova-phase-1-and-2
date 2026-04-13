import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/markets', label: 'Markets' },
  { to: '/invest', label: 'Invest' },
  { to: '/alerts', label: 'Alerts' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-root-bg/80 backdrop-blur-xl border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-full bg-primary-blue" />
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                      isActive
                        ? 'text-text-primary bg-card-bg'
                        : 'text-text-muted hover:text-text-primary hover:bg-card-bg/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
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
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-loss transition-colors bg-transparent border-none cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
