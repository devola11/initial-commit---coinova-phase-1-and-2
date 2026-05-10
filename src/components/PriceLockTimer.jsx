import { useState, useEffect } from 'react'

export default function PriceLockTimer({ lockedAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(3600)

  useEffect(() => {
    if (!lockedAt) return

    const calculate = () => {
      const elapsed = Math.floor((Date.now() - lockedAt) / 1000)
      const remaining = 3600 - elapsed
      if (remaining <= 0) {
        setTimeLeft(0)
        onExpire && onExpire()
        return
      }
      setTimeLeft(remaining)
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [lockedAt, onExpire])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isUrgent = timeLeft < 300

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: isUrgent ? '#F6465D15' : '#FFD70015',
      border: `1px solid ${isUrgent ? '#F6465D' : '#FFD700'}`,
      borderRadius: 8,
      fontSize: 13
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: isUrgent ? '#F6465D' : '#FFD700',
        animation: 'pulse 1s infinite'
      }} />
      <span style={{
        color: isUrgent ? '#F6465D' : '#FFD700',
        fontWeight: 600
      }}>
        Price locked for: {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
