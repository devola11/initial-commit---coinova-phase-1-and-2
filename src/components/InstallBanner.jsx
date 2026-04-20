import { useState, useEffect } from 'react'
import logo from '../assets/logo.jpeg'

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [browser, setBrowser] = useState('chrome')
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches || window.navigator.standalone

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - parseInt(dismissed) < sevenDays) return
    }

    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
    const safari = /Safari/.test(ua) && !/Chrome/.test(ua)
    const firefox = /Firefox/.test(ua)

    setIsIOS(ios)

    if (ios || safari) {
      setBrowser('safari')
      setShow(true)
    } else if (firefox) {
      setBrowser('firefox')
      setShow(true)
    } else {
      setBrowser('chrome')
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
      setBrowser('chrome')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true')
      }
      setShow(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', Date.now().toString())
    setShow(false)
  }

  if (!show || isInstalled) return null

  const getInstructions = () => {
    if (browser === 'safari' || isIOS) {
      return {
        icon: '□↑',
        text: 'Tap Share then "Add to Home Screen"',
        buttonText: 'How to install on iPhone'
      }
    }
    if (browser === 'firefox') {
      return {
        icon: '⋮',
        text: 'Tap menu then "Install"',
        buttonText: 'Install Coinova'
      }
    }
    return {
      icon: null,
      text: 'Add to your home screen',
      buttonText: 'Install App'
    }
  }

  const instructions = getInstructions()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#141519',
      borderTop: '1px solid #1E2025',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
    }}>
      <img src={logo} alt="Coinova"
        style={{
          width: 40, height: 40,
          borderRadius: 8, flexShrink: 0
        }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#fff', fontWeight: 600,
          fontSize: 14
        }}>
          Install Coinova App
        </div>
        <div style={{
          color: '#8A919E', fontSize: 12,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {instructions.text}
        </div>
      </div>
      {browser === 'chrome' && prompt ? (
        <button onClick={handleInstall} style={{
          background: '#0052FF',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0
        }}>
          Install
        </button>
      ) : (
        <div style={{
          background: '#0052FF20',
          color: '#0052FF',
          border: '1px solid #0052FF',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
          textAlign: 'center'
        }}>
          {instructions.icon && (
            <div style={{ fontSize: 16 }}>
              {instructions.icon}
            </div>
          )}
          <div>Tap to install</div>
        </div>
      )}
      <button onClick={handleDismiss} style={{
        background: 'transparent',
        color: '#8A919E',
        border: 'none',
        fontSize: 20,
        cursor: 'pointer',
        padding: '4px',
        flexShrink: 0
      }}>
        x
      </button>
    </div>
  )
}
