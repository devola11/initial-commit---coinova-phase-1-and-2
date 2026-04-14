import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePIN } from '../hooks/usePIN'
import { useBiometric } from '../hooks/useBiometric'
import PINPad from './PINPad'

const LOCK_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export default function AppLock({ children }) {
  const { user, logout } = useAuth()
  const { pinEnabled, verifyPIN } = usePIN()
  const { enabled: bioEnabled, verifyBiometric } = useBiometric()
  const [locked, setLocked] = useState(false)
  const [wrongPin, setWrongPin] = useState(false)
  const [displayName, setDisplayName] = useState('')

  // Track visibility changes
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        localStorage.setItem('coinova-last-active', String(Date.now()))
      } else {
        const lastActive = localStorage.getItem('coinova-last-active')
        if (lastActive && Date.now() - Number(lastActive) > LOCK_TIMEOUT) {
          if (localStorage.getItem('coinova-pin-hash')) {
            setLocked(true)
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Load display name
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.email || '')
    }
  }, [user])

  // Auto-trigger biometric on lock
  useEffect(() => {
    if (locked && bioEnabled) {
      handleBiometric()
    }
  }, [locked, bioEnabled])

  async function handlePinEntry(pin) {
    if (!user) return
    const ok = await verifyPIN(pin, user.id)
    if (ok) {
      setLocked(false)
      setWrongPin(false)
      localStorage.setItem('coinova-last-active', String(Date.now()))
    } else {
      setWrongPin(true)
      setTimeout(() => setWrongPin(false), 600)
    }
  }

  async function handleBiometric() {
    const ok = await verifyBiometric()
    if (ok) {
      setLocked(false)
      localStorage.setItem('coinova-last-active', String(Date.now()))
    }
  }

  async function handleSignOut() {
    await logout()
    setLocked(false)
    window.location.href = '/'
  }

  if (!locked || !user) return children

  return (
    <div className="fixed inset-0 z-[300] bg-[#0A0B0D] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="w-14 h-14 rounded-full bg-[#0052FF] flex items-center justify-center mb-4">
        <span className="text-white text-xl font-bold">C</span>
      </div>
      <div className="text-[#8A8F98] text-sm mb-8">
        Welcome back{displayName ? `, ${displayName}` : ''}
      </div>

      <PINPad
        title="Enter your PIN"
        subtitle="Unlock your Coinova account"
        onSuccess={handlePinEntry}
        showBiometric={bioEnabled}
        onBiometric={handleBiometric}
      />

      {wrongPin && (
        <div className="text-[#F6465D] text-xs mt-4">Incorrect PIN, try again</div>
      )}

      <button
        onClick={handleSignOut}
        className="mt-8 text-[#8A8F98] hover:text-[#F6465D] text-xs bg-transparent border-none cursor-pointer transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
