import { useAuth } from '../context/AuthContext'

function getDisplayName(user) {
  return user?.user_metadata?.display_name || user?.email || ''
}

function getInitials(user) {
  const displayName = user?.user_metadata?.display_name
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  const email = user?.email || ''
  return email.substring(0, 1).toUpperCase() || 'C'
}

export default function UserAvatar({ size = 36, onClick }) {
  const { user } = useAuth()
  const initials = getInitials(user)
  const label = getDisplayName(user)

  return (
    <button
      onClick={onClick}
      type="button"
      aria-label={`Open account menu for ${label}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#0052FF',
        color: '#FFFFFF',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'box-shadow 0.2s',
        boxShadow: '0 0 0 2px transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 82, 255, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px transparent'
      }}
    >
      {initials}
    </button>
  )
}
