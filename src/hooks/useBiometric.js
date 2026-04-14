import { useState, useEffect } from 'react'

export function useBiometric() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    checkSupport()
    setEnabled(localStorage.getItem('coinova-biometric-enabled') === 'true')
  }, [])

  async function checkSupport() {
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setSupported(available)
      } catch {
        setSupported(false)
      }
    }
  }

  async function registerBiometric(userId, userName) {
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Coinova',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      })

      if (credential) {
        const credentialId = btoa(
          String.fromCharCode(...new Uint8Array(credential.rawId))
        )
        localStorage.setItem('coinova-credential-id', credentialId)
        localStorage.setItem('coinova-biometric-enabled', 'true')
        setEnabled(true)
        return true
      }
      return false
    } catch (e) {
      console.error('Biometric registration failed:', e)
      return false
    }
  }

  async function verifyBiometric() {
    try {
      const credentialIdStr = localStorage.getItem('coinova-credential-id')
      if (!credentialIdStr) return false

      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const credentialId = Uint8Array.from(atob(credentialIdStr), c => c.charCodeAt(0))

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: credentialId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      })

      return !!assertion
    } catch (e) {
      console.error('Biometric verification failed:', e)
      return false
    }
  }

  function disableBiometric() {
    localStorage.removeItem('coinova-biometric-enabled')
    localStorage.removeItem('coinova-credential-id')
    setEnabled(false)
  }

  return { supported, enabled, registerBiometric, verifyBiometric, disableBiometric }
}
