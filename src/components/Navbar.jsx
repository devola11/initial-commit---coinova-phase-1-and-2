import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/markets', label: 'Markets' },
  { to: '/alerts', label: 'Alerts' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
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

          {/* Nav links */}
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                    location.pathname === '/settings'
                      ? 'text-text-primary bg-card-bg'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-loss transition-colors bg-transparent border-none cursor-pointer"
                >
                  Log out
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

        {/* Mobile nav */}
        {user && (
          <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors no-underline ${
                    isActive
                      ? 'text-text-primary bg-card-bg'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
