import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CNCPromoBanner() {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('cnc-banner-dismissed') === 'true'
  )

  if (dismissed) return null

  const handleDismiss = (e) => {
    e.stopPropagation()
    sessionStorage.setItem('cnc-banner-dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div
      onClick={() => navigate('/cnc')}
      style={{
        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
        padding: '10px 40px 10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        cursor: 'pointer',
        position: 'relative',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          animation: 'cnc-banner-pulse 1.5s infinite',
        }}
      />
      <span style={{ color: '#000', fontWeight: 700, fontSize: 14 }}>
        CNC PRESALE LIVE
      </span>
      <span style={{ color: '#000', fontSize: 13 }}>
        Buy Coinova Coin at $0.05 (50% off launch price)
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigate('/cnc')
        }}
        style={{
          background: '#000',
          color: '#FFD700',
          border: 'none',
          padding: '4px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Buy now
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: '#000',
          fontSize: 18,
          cursor: 'pointer',
          padding: 4,
          opacity: 0.6,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes cnc-banner-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
