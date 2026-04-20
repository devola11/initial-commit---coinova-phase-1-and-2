import { useEffect, useState } from 'react'

const STORAGE_KEY = 'coinova-account-mode'
const EVENT_NAME = 'accountModeChange'

function readMode() {
  if (typeof window === 'undefined') return 'demo'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'wallet' ? 'wallet' : 'demo'
}

export function useAccountMode() {
  const [mode, setMode] = useState(readMode)

  useEffect(() => {
    const handler = () => setMode(readMode())
    window.addEventListener(EVENT_NAME, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT_NAME, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  function switchMode(newMode) {
    const next = newMode === 'wallet' ? 'wallet' : 'demo'
    window.localStorage.setItem(STORAGE_KEY, next)
    setMode(next)
    window.dispatchEvent(new Event(EVENT_NAME))
  }

  return {
    mode,
    switchMode,
    isDemo: mode === 'demo',
    isWallet: mode === 'wallet',
  }
}
