import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('coinova-theme') || 'dark'
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function applyTheme(t) {
    const root = document.documentElement

    if (t === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      root.setAttribute('data-theme', systemTheme)
      document.body.setAttribute('data-theme', systemTheme)
      root.style.colorScheme = systemTheme
    } else {
      root.setAttribute('data-theme', t)
      document.body.setAttribute('data-theme', t)
      root.style.colorScheme = t
    }

    localStorage.setItem('coinova-theme', t)
  }

  function changeTheme(newTheme) {
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('coinova-theme', newTheme)
  }

  return { theme, changeTheme }
}
