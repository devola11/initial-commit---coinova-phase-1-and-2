import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useKycStatus } from './KYCBanner'
import { formatUSD } from '../utils/formatters'

const FUND_OPTIONS = [
  {
    key: 'usdt_trc20',
    label: 'USDT TRC-20',
    network: 'Tron (TRC-20)',
    address: 'TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca',
    recommended: true,
  },
  {
    key: 'btc',
    label: 'Bitcoin (BTC)',
    network: 'Bitcoin',
    address: 'bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl',
  },
  {
    key: 'eth',
    label: 'Ethereum (ETH)',
    network: 'Ethereum (ERC-20)',
    address: '0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458',
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="px-3 py-1.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-xs font-semibold bg-transparent cursor-pointer transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function FundWalletModal({ onClose }) {
  const { user } = useAuth()
  const { kycStatus } = useKycStatus()
  const [option, setOption] = useState(FUND_OPTIONS[0])
  const [usd, setUsd] = useState('')
  const [txHash, setTxHash] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const usdAmount = Number(usd) || 0

  async function handleSubmit() {
    setError('')
    if (!user) { setError('You must be signed in.'); return }
    if (usdAmount <= 0) { setError('Enter a USD amount.'); return }
    if (!txHash.trim()) { setError('Enter the transaction hash.'); return }

    setSubmitting(true)
    try {
      const { error: e } = await supabase.from('investment_requests').insert({
        user_id: user.id,
        user_email: user.email || '',
        coin_id: 'wallet-funding',
        coin_symbol: option.label.split(' ')[0].toUpperCase(),
        coin_name: 'Main Wallet Funding',
        coin_image: null,
        coin_price_at_submission: 1,
        amount_usd: usdAmount,
        wallet_used: option.key,
        wallet_address: option.address,
        tx_hash: txHash.trim(),
        status: 'pending',
      })
      if (e) throw e
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const isVerified = kycStatus === 'approved'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-text-primary font-semibold text-lg">Fund Your Main Wallet</div>
            <div className="text-text-muted text-sm mt-1">Send real crypto to your Coinova wallet</div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        {!isVerified ? (
          <div className="bg-root-bg border border-card-border rounded-lg p-5 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="text-text-primary font-semibold mb-2">Complete KYC to unlock wallet funding</div>
            <p className="text-text-muted text-sm mb-5">
              Verify your identity to fund your Main Wallet with real cryptocurrency.
            </p>
            <Link
              to="/kyc"
              onClick={onClose}
              className="inline-block w-full py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold no-underline transition-colors"
            >
              Complete KYC
            </Link>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-profit/20 mx-auto mb-4 flex items-center justify-center text-3xl text-profit">✓</div>
            <div className="text-text-primary font-semibold text-lg mb-2">Funding request submitted</div>
            <div className="text-text-muted text-sm mb-5">
              Your Main Wallet will be credited within 24 hours after verification.
            </div>
            <div className="bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2 text-left mb-5">
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-primary font-semibold">{formatUSD(usdAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Network</span>
                <span className="text-text-primary font-medium">{option.label}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted flex-shrink-0">TX hash</span>
                <span className="text-text-primary font-mono text-xs break-all text-right">{txHash}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: 'none' }}>
              {FUND_OPTIONS.map((opt) => {
                const active = opt.key === option.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setOption(opt)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary-blue border-primary-blue text-white'
                        : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
                    }`}
                  >
                    {opt.label}{opt.recommended && !active ? ' · recommended' : ''}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col items-center bg-root-bg border border-card-border rounded-lg p-5 mb-4">
              <div className="bg-white p-3 rounded-lg mb-4">
                <QRCodeSVG value={option.address} size={150} level="M" />
              </div>
              <div className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
                {option.label} address · {option.network}
              </div>
              <div className="text-text-primary text-xs font-mono break-all text-center mb-3">
                {option.address}
              </div>
              <CopyButton text={option.address} />
            </div>

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              How much did you send? (USD equivalent)
            </label>
            <input
              type="number"
              min="0"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
              placeholder="0.00"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-lg text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors mb-4"
            />

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              Transaction hash
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter your TX hash after sending"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-xs text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue font-mono"
            />

            {error && (
              <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || usdAmount <= 0 || !txHash.trim()}
              className="w-full mt-5 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
