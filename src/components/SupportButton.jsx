import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SupportButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  const items = [
    {
      label: 'Browse FAQ',
      path: '/faq',
      desc: 'Common questions',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      ),
    },
    {
      label: 'Submit ticket',
      path: '/contact',
      desc: 'Get help from our team',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      ),
    },
    {
      label: 'View my tickets',
      path: '/my-tickets',
      desc: 'Track your requests',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11H1l8-8 8 8h-8v8h-8z" transform="rotate(45 12 12)"/><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
      ),
    },
  ]

  return (
    <div ref={ref} style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9990 }}>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 72,
            right: 0,
            width: 280,
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            animation: 'supportMenuIn 0.18s ease-out',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2025' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Need help?</div>
            <div style={{ color: '#8A919E', fontSize: 12, marginTop: 2 }}>
              We typically reply within 24h
            </div>
          </div>
          <div style={{ padding: 6 }}>
            {items.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1E2025')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(0, 82, 255, 0.12)',
                    color: '#0052FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#8A919E', marginTop: 1 }}>{item.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close support menu' : 'Open support menu'}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#0052FF',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 82, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#0040CC'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0052FF'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes supportMenuIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
