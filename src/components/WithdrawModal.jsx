import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendSecurityEmail } from '../utils/notifications'
import { logActivity } from '../utils/activityLogger'

export default function WithdrawModal({ onClose, walletBalance, cncBalance }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [type, setType] = useState('crypto')
  const [coin, setCoin] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')

  const networks = {
    USDT: 'TRC-20',
    BTC: 'Bitcoin',
    ETH: 'ERC-20',
    CNC: 'Coinova Network',
  }

  const minWithdrawals = {
    USDT: 10,
    BTC: 50,
    ETH: 25,
    CNC: 100,
  }

  const generateRequestNumber = async () => {
    const { count } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
    const num = String((count || 0) + 1).padStart(4, '0')
    return 'WD-2026-' + num
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter valid amount')
      setLoading(false)
      return
    }

    const min = minWithdrawals[coin]
    if (type === 'crypto' && numAmount < min) {
      setError('Minimum withdrawal is $' + min)
      setLoading(false)
      return
    }

    if (type === 'cnc' && numAmount < min) {
      setError('Minimum withdrawal is ' + min + ' CNC')
      setLoading(false)
      return
    }

    if (type === 'crypto' && numAmount > walletBalance) {
      setError('Insufficient wallet balance')
      setLoading(false)
      return
    }

    if (type === 'cnc' && numAmount > cncBalance) {
      setError('Insufficient CNC balance')
      setLoading(false)
      return
    }

    if (!destination || destination.length < 20) {
      setError('Enter valid wallet address')
      setLoading(false)
      return
    }

    try {
      const reqNum = await generateRequestNumber()

      const { error: dbError } = await supabase
        .from('withdrawal_requests')
        .insert({
          request_number: reqNum,
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.display_name,
          withdrawal_type: type,
          coin_symbol: coin,
          coin_name: coin === 'CNC' ? 'Coinova Coin' : coin,
          amount: numAmount,
          amount_usd: type === 'cnc' ? numAmount * 0.05 : numAmount,
          destination_address: destination,
          network: networks[coin],
          status: 'pending',
        })
        .select()
        .single()

      if (dbError) throw dbError

      if (type === 'crypto') {
        await supabase
          .from('wallet')
          .update({ wallet_balance: walletBalance - numAmount })
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('cnc_holdings')
          .update({ quantity: cncBalance - numAmount })
          .eq('user_id', user.id)
      }

      await sendSecurityEmail({
        userEmail: user.email,
        userName: user.user_metadata?.display_name,
        type: 'withdrawal_received',
        details: {
          requestNumber: reqNum,
          amount: numAmount,
          symbol: coin,
          destination:
            destination.substring(0, 8) + '...' + destination.slice(-6),
        },
      })

      await logActivity({
        userId: user.id,
        action: 'withdrawal_requested',
        description: 'Withdrawal request: ' + numAmount + ' ' + coin,
        metadata: { requestNumber: reqNum, amount: numAmount, coin },
      })

      setRequestNumber(reqNum)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Failed to submit')
    }

    setLoading(false)
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h2 style={{ color: '#fff', margin: 0, fontSize: 20 }}>
            {step === 1 && 'Withdraw Funds'}
            {step === 2 && 'Confirm Withdrawal'}
            {step === 3 && 'Withdrawal Submitted'}
          </h2>
          <button onClick={onClose} style={closeBtn}>
            &times;
          </button>
        </div>

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Type</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <button
                  onClick={() => {
                    setType('crypto')
                    setCoin('USDT')
                  }}
                  style={{
                    ...selectorBtn,
                    ...(type === 'crypto' ? activeBtn : {}),
                  }}
                >
                  Crypto (USDT/BTC/ETH)
                </button>
                <button
                  onClick={() => {
                    setType('cnc')
                    setCoin('CNC')
                  }}
                  style={{
                    ...selectorBtn,
                    ...(type === 'cnc' ? activeBtn : {}),
                  }}
                >
                  Coinova Coin (CNC)
                </button>
              </div>
            </div>

            {type === 'crypto' && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Coin</label>
                <select
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  style={inputStyle}
                >
                  <option value="USDT">USDT (TRC-20)</option>
                  <option value="BTC">Bitcoin</option>
                  <option value="ETH">Ethereum (ERC-20)</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Amount{' '}
                {type === 'cnc'
                  ? '(' + cncBalance.toFixed(2) + ' CNC available)'
                  : '($' + walletBalance.toFixed(2) + ' available)'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
              <div style={{ fontSize: 12, color: '#8A919E', marginTop: 4 }}>
                Minimum:{' '}
                {type === 'cnc' ? '100 CNC' : '$' + minWithdrawals[coin]}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Destination Wallet ({networks[coin]})
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Paste your wallet address"
                style={inputStyle}
              />
              <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>
                Double-check address! Wrong address means lost funds.
              </div>
            </div>

            <div
              style={{
                background: '#F59E0B15',
                border: '1px solid #F59E0B',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                color: '#F59E0B',
                fontSize: 13,
              }}
            >
              <strong>Processing time: Up to 24 hours</strong>
              <div style={{ marginTop: 4 }}>
                All withdrawals are manually reviewed for security.
              </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <button
              onClick={() => setStep(2)}
              disabled={!amount || !destination}
              style={{
                ...primaryBtn,
                ...(!amount || !destination ? disabledBtn : {}),
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div style={detailRow}>
                <span style={detailLabel}>Type</span>
                <span style={detailValue}>
                  {type === 'crypto' ? 'Crypto' : 'CNC Token'}
                </span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}>Coin</span>
                <span style={detailValue}>{coin}</span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}>Network</span>
                <span style={detailValue}>{networks[coin]}</span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}>Amount</span>
                <span style={detailValue}>
                  {amount} {coin}
                </span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}>Destination</span>
                <span style={detailValue}>
                  {destination.substring(0, 10)}...{destination.slice(-8)}
                </span>
              </div>
              <div style={{ ...detailRow, borderBottom: 'none' }}>
                <span style={detailLabel}>Processing</span>
                <span style={detailValue}>Up to 24 hours</span>
              </div>
            </div>

            <div
              style={{
                background: '#F6465D15',
                border: '1px solid #F6465D',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                color: '#F6465D',
                fontSize: 13,
              }}
            >
              Confirm details before submitting. Withdrawals cannot be reversed.
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={secondaryBtn}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ ...primaryBtn, ...(loading ? disabledBtn : {}) }}
              >
                {loading ? 'Submitting...' : 'Submit Withdrawal'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#05B16920',
                border: '2px solid #05B169',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                color: '#05B169',
              }}
            >
              &#10003;
            </div>

            <h3 style={{ color: '#fff', margin: '0 0 12px 0' }}>
              Withdrawal Submitted!
            </h3>

            <p style={{ color: '#8A919E', marginBottom: 16 }}>
              Your request has been received and is being processed.
            </p>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #FFD700',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: '#FFD700',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                REQUEST NUMBER
              </div>
              <div
                style={{
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                {requestNumber}
              </div>
            </div>

            <div
              style={{
                color: '#8A919E',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              Processing time: Up to 24 hours. You will receive an email when
              complete.
            </div>

            <button onClick={onClose} style={primaryBtn}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 20,
}

const modalStyle = {
  background: '#141519',
  border: '1px solid #1E2025',
  borderRadius: 16,
  padding: 28,
  maxWidth: 480,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const labelStyle = {
  display: 'block',
  color: '#8A919E',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#0A0B0D',
  border: '1px solid #1E2025',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
}

const selectorBtn = {
  padding: 12,
  background: '#0A0B0D',
  border: '1px solid #1E2025',
  borderRadius: 8,
  color: '#8A919E',
  fontSize: 13,
  cursor: 'pointer',
}

const activeBtn = {
  background: '#0052FF20',
  borderColor: '#0052FF',
  color: '#0052FF',
  fontWeight: 600,
}

const closeBtn = {
  background: 'transparent',
  border: 'none',
  color: '#8A919E',
  fontSize: 24,
  cursor: 'pointer',
  lineHeight: 1,
}

const primaryBtn = {
  flex: 1,
  width: '100%',
  padding: 14,
  background: '#0052FF',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryBtn = {
  flex: 1,
  padding: 14,
  background: '#1E2025',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}

const disabledBtn = {
  opacity: 0.5,
  cursor: 'not-allowed',
}

const errorStyle = {
  padding: 12,
  background: '#F6465D15',
  border: '1px solid #F6465D',
  borderRadius: 8,
  color: '#F6465D',
  fontSize: 13,
  marginBottom: 16,
}

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #1E2025',
}

const detailLabel = {
  color: '#8A919E',
  fontSize: 13,
}

const detailValue = {
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
}
