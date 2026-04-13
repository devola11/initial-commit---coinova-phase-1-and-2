import { useState, useEffect } from 'react'
import logo from '../assets/logo.jpeg'

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const installed = localStorage.getItem('pwa-installed')
    if (installed) return

    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < sevenDays) return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true')
    }
    setShow(false)
    setPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', Date.now().toString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#141519] border-t border-[#1E2025] px-5 py-4 flex items-center gap-3 z-[9999]">
      <img src={logo} alt="Coinova" className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">Install Coinova App</div>
        <div className="text-[#8A919E] text-xs">Add to your home screen for quick access</div>
      </div>
      <button onClick={handleInstall}
        className="px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-[13px] font-semibold border-none cursor-pointer transition-colors flex-shrink-0">
        Install
      </button>
      <button onClick={handleDismiss}
        className="bg-transparent border-none text-[#8A919E] hover:text-white text-xl cursor-pointer px-2 py-1 transition-colors flex-shrink-0">
        &times;
      </button>
    </div>
  )
}
