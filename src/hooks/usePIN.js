import { useState, useEffect } from 'react'

export function usePIN() {
  const [pinEnabled, setPinEnabled] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('coinova-pin-hash')
    if (stored) {
      setPinEnabled(true)
    }
  }, [])

  async function hashPIN(pin, userId) {
    const data = new TextEncoder().encode(pin + userId)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function setupPIN(pin, userId) {
    const hash = await hashPIN(pin, userId)
    localStorage.setItem('coinova-pin-hash', hash)
    localStorage.setItem('coinova-pin-enabled', 'true')
    setPinEnabled(true)
    return true
  }

  async function verifyPIN(pin, userId) {
    const stored = localStorage.getItem('coinova-pin-hash')
    if (!stored) return false
    const hash = await hashPIN(pin, userId)
    return hash === stored
  }

  function disablePIN() {
    localStorage.removeItem('coinova-pin-hash')
    localStorage.removeItem('coinova-pin-enabled')
    localStorage.removeItem('coinova-biometric-enabled')
    setPinEnabled(false)
  }

  function isPINEnabled() {
    return !!localStorage.getItem('coinova-pin-hash')
  }

  return { pinEnabled, setupPIN, verifyPIN, disablePIN, isPINEnabled }
}
