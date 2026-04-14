import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePIN } from '../hooks/usePIN'
import { useBiometric } from '../hooks/useBiometric'
import PINPad from './PINPad'

export default function PINConfirm({ title, subtitle, onVerified, onCancel }) {
  const { user } = useAuth()
  const { verifyPIN } = usePIN()
  const { enabled: bioEnabled, verifyBiometric } = useBiometric()
  const [wrong, setWrong] = useState(false)

  async function handlePin(pin) {
    const ok = await verifyPIN(pin, user.id)
    if (ok) {
      onVerified()
    } else {
      setWrong(true)
      setTimeout(() => setWrong(false), 600)
    }
  }

  async function handleBiometric() {
    const ok = await verifyBiometric()
    if (ok) onVerified()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
        <PINPad
          title={title || 'Confirm with PIN'}
          subtitle={subtitle || 'Enter your PIN to continue'}
          onSuccess={handlePin}
          onCancel={onCancel}
          showBiometric={bioEnabled}
          onBiometric={handleBiometric}
        />
        {wrong && (
          <div className="text-[#F6465D] text-xs mt-4 text-center">Incorrect PIN, try again</div>
        )}
      </div>
    </div>
  )
}
