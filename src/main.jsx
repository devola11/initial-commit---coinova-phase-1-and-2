import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const savedTheme = localStorage.getItem('coinova-theme') || 'dark'
if (savedTheme === 'light') {
  document.body.style.background = '#FFFFFF'
  document.body.style.color = '#000000'
  document.documentElement.setAttribute('data-theme', 'light')
} else {
  document.body.style.background = '#0A0B0D'
  document.body.style.color = '#FFFFFF'
  document.documentElement.setAttribute('data-theme', 'dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err))
  })
}
