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
    if (t === 'dark') {
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
      document.body.style.background = '#0A0B0D'
      document.body.style.color = '#FFFFFF'
    } else if (t === 'light') {
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
      document.body.style.background = '#FFFFFF'
      document.body.style.color = '#000000'
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      applyTheme(prefersDark ? 'dark' : 'light')
      return
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
