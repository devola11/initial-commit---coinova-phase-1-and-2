import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePIN } from '../hooks/usePIN'
import { useBiometric } from '../hooks/useBiometric'
import PINPad from './PINPad'

export default function PINSetup({ onComplete, onCancel }) {
  const { user } = useAuth()
  const { setupPIN } = usePIN()
  const { supported: bioSupported, registerBiometric } = useBiometric()
  const [step, setStep] = useState(1) // 1=create, 2=confirm, 3=success
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [bioLoading, setBioLoading] = useState(false)

  function handleFirstPin(pin) {
    setFirstPin(pin)
    setError('')
    setStep(2)
  }

  async function handleConfirmPin(pin) {
    if (pin === firstPin) {
      await setupPIN(pin, user.id)
      setStep(3)
    } else {
      setError("PINs don't match, try again")
      setFirstPin('')
      setStep(1)
    }
  }

  async function handleEnableBiometric() {
    setBioLoading(true)
    const ok = await registerBiometric(user.id, user.email || 'user')
    setBioLoading(false)
    if (ok) {
      onComplete?.()
    }
  }

  if (step === 3) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onCancel}>
        <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
          <div
            className="w-16 h-16 rounded-full bg-[#05B169]/20 mx-auto mb-4 flex items-center justify-center"
            style={{ animation: 'pin-pop 0.4s ease-out' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <style>{`@keyframes pin-pop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>
          <div className="text-white font-semibold text-lg mb-2">PIN created successfully!</div>
          <div className="text-[#8A8F98] text-sm mb-6">Your PIN protects your Cointehera account</div>

          {bioSupported ? (
            <>
              <div className="text-[#8A8F98] text-sm mb-4">Also enable fingerprint / Face ID?</div>
              <button
                onClick={handleEnableBiometric}
                disabled={bioLoading}
                className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 mb-3"
              >
                {bioLoading ? 'Setting up...' : 'Enable biometric'}
              </button>
              <button
                onClick={() => onComplete?.()}
                className="text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={() => onComplete?.()}
              className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    )
  }

  function handleBack() {
    setError('')
    setFirstPin('')
    setStep(1)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
        <div className="text-[#8A8F98] text-xs text-center mb-4 uppercase tracking-wider">
          Step {step} of 2 — {step === 1 ? 'Enter PIN' : 'Confirm PIN'}
        </div>
        {error && (
          <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 text-[#F6465D] text-xs rounded-lg px-4 py-2 mb-4 text-center">
            {error}
          </div>
        )}
        <PINPad
          key={step}
          title={step === 1 ? 'Create your PIN' : 'Confirm your PIN'}
          subtitle={step === 1 ? 'Choose a 4-digit PIN for quick access' : 'Enter your PIN again'}
          onSuccess={step === 1 ? handleFirstPin : handleConfirmPin}
          onCancel={onCancel}
        />
        {step === 2 && (
          <button
            onClick={handleBack}
            className="block mx-auto mt-3 text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
