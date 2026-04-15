import { useState, useEffect, useCallback } from 'react'

function FingerprintIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 1.7 0 3.2.7 4.2 1.8" />
      <path d="M9 12c0-1.7 1.3-3 3-3s3 1.3 3 3v1" />
      <path d="M12 12v4c0 2.5-1 4-2.5 5.5" />
      <path d="M18 12c0 4-1 7-3 9" />
      <path d="M22 16c-1 1.5-2 3.5-3 5" />
    </svg>
  )
}

function BackspaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A8F98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  )
}

export default function PINPad({ title, subtitle, onSuccess, onCancel, showBiometric, onBiometric }) {
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('idle') // idle, wrong, correct
  const [shake, setShake] = useState(false)

  const handleNumber = useCallback((num) => {
    if (pin.length >= 4) return
    const next = pin + num
    setPin(next)
    if (next.length === 4) {
      // Auto-submit after 4 digits - caller handles via onSuccess
      setTimeout(() => {
        onSuccess(next)
      }, 150)
    }
  }, [pin, onSuccess])

  useEffect(() => {
    function handleKeydown(e) {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key)
      if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      if (e.key === 'Escape' && onCancel) onCancel()
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [handleNumber, onCancel])

  function triggerWrong() {
    setStatus('wrong')
    setShake(true)
    setTimeout(() => { setShake(false); setStatus('idle'); setPin('') }, 600)
  }

  function triggerCorrect() {
    setStatus('correct')
  }

  // Expose methods via ref-like pattern
  useEffect(() => {
    if (window.__pinPadRef) {
      window.__pinPadRef.triggerWrong = triggerWrong
      window.__pinPadRef.triggerCorrect = triggerCorrect
    }
  })

  const dotColor = status === 'wrong' ? '#F6465D' : status === 'correct' ? '#05B169' : '#0052FF'

  return (
    <div className="flex flex-col items-center">
      {title && <div className="text-white text-lg font-semibold mb-1">{title}</div>}
      {subtitle && <div className="text-[#8A8F98] text-sm mb-6">{subtitle}</div>}

      {/* PIN dots */}
      <div
        className={`flex gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-5 h-5 rounded-full transition-all duration-150"
            style={{
              background: i < pin.length ? dotColor : 'transparent',
              border: i < pin.length ? `2px solid ${dotColor}` : '2px solid #2C2F36',
            }}
          />
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleNumber(String(n))}
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#141519] border border-[#1E2025] text-white text-xl sm:text-2xl font-medium flex items-center justify-center cursor-pointer transition-transform active:scale-95 active:bg-[#1E2025] hover:border-[#2C2F36]"
          >
            {n}
          </button>
        ))}
        {/* Bottom row */}
        <button
          onClick={() => showBiometric && onBiometric ? onBiometric() : null}
          className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer transition-transform active:scale-95 ${
            showBiometric ? 'bg-[#141519] border border-[#1E2025]' : 'bg-transparent'
          }`}
          style={!showBiometric ? { visibility: 'hidden' } : {}}
        >
          <FingerprintIcon />
        </button>
        <button
          onClick={() => handleNumber('0')}
          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#141519] border border-[#1E2025] text-white text-xl sm:text-2xl font-medium flex items-center justify-center cursor-pointer transition-transform active:scale-95 active:bg-[#1E2025] hover:border-[#2C2F36]"
        >
          0
        </button>
        <button
          onClick={() => setPin(p => p.slice(0, -1))}
          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#141519] border border-[#1E2025] flex items-center justify-center cursor-pointer transition-transform active:scale-95 active:bg-[#1E2025] hover:border-[#2C2F36]"
        >
          <BackspaceIcon />
        </button>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
        >
          Cancel
        </button>
      )}

      {/* Shake keyframe injected once */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}

// Helper for parent components to reset PIN pad
PINPad.resetRef = () => {
  window.__pinPadRef = {}
  return window.__pinPadRef
}
