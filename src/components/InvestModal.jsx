import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCoinImageUrl } from '../utils/coinImages'
import { formatUSD } from '../utils/formatters'
import { walletForCoin } from '../utils/coinCategories'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

function CoinAvatar({ coin, size = 40 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(coin.id, coin.image)
  if (!src || err) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-primary-blue/30 flex items-center justify-center text-white text-xs font-bold"
      >
        {(coin.symbol || '').slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={coin.symbol}
      onError={() => setErr(true)}
      style={{ width: size, height: size }}
      className="rounded-full bg-white/5"
    />
  )
}

// `wallets` is the full INVEST_WALLETS map; we pick the right entry based on
// the coin id. This keeps all wallet routing logic in one place.
export default function InvestModal({ coin, wallets, onClose }) {
  const { user } = useAuth()
  const walletKey = walletForCoin(coin.id)
  const wallet = wallets[walletKey]
  const symbol = (coin.symbol || '').toUpperCase()

  const [step, setStep] = useState(1)
  const [usd, setUsd] = useState('')
  const [txHash, setTxHash] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedAt, setSubmittedAt] = useState(null)

  const price = coin.current_price || 0
  const usdAmount = Number(usd) || 0
  const receiveQty = price > 0 && usdAmount > 0 ? usdAmount / price : 0
  const networkBadge =
    walletKey === 'btc'
      ? 'Send via Bitcoin network'
      : walletKey === 'eth'
        ? 'Send via Ethereum network'
        : 'Send USDT via TRC-20 network'

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('copy failed', err)
    }
  }

  async function handleSubmit() {
    setError('')
    if (!user) {
      setError('You must be signed in.')
      return
    }
    if (!txHash.trim()) {
      setError('Please enter the transaction hash.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setSubmitting(true)
    try {
      const { error: e } = await supabase.from('investment_requests').insert({
        user_id: user.id,
        user_email: email.trim(),
        coin_id: coin.id,
        coin_symbol: symbol,
        coin_name: coin.name,
        coin_image: coin.image || null,
        coin_price_at_submission: price || null,
        amount_usd: usdAmount,
        wallet_used: walletKey,
        wallet_address: wallet.address,
        tx_hash: txHash.trim(),
        status: 'pending',
      })
      if (e) throw e
      setSubmittedAt(new Date().toISOString())
      setStep(3)
    } catch (err) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const canContinue = usdAmount > 0 && price > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <CoinAvatar coin={coin} />
            <div>
              <div className="text-text-primary font-semibold">
                Invest in {coin.name}
              </div>
              <div className="text-text-muted text-xs uppercase">{symbol}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                step >= s ? 'bg-primary-blue' : 'bg-card-border'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-text-muted">Live price</span>
              <span className="text-text-primary font-semibold">
                {price > 0 ? formatUSD(price) : 'Price unavailable'}
              </span>
            </div>

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              Amount (USD)
            </label>
            <input
              type="number"
              min="0"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
              placeholder="0.00"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-lg text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setUsd(String(amt))}
                  className="flex-1 min-w-[60px] px-2 py-2 rounded-lg border border-card-border text-text-primary text-xs font-semibold bg-transparent hover:border-primary-blue cursor-pointer transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="mt-5 bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">You will receive</span>
                <span className="text-text-primary font-semibold">
                  {receiveQty > 0 ? receiveQty.toFixed(8) : '—'} {symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Network</span>
                <span className="text-text-primary font-medium">
                  {wallet.network}
                </span>
              </div>
            </div>

            <div className="mt-4 bg-primary-blue/5 border border-primary-blue/20 rounded-lg px-4 py-3 text-xs text-primary-blue font-medium">
              {networkBadge}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canContinue}
              className="w-full mt-5 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-loss/10 border border-loss/30 rounded-lg px-4 py-3 text-xs text-loss mb-4">
              {wallet.warning}. Wrong asset or wrong network = permanent loss.
            </div>

            <div className="flex flex-col items-center bg-root-bg border border-card-border rounded-lg p-5 mb-4">
              <div className="bg-white p-3 rounded-lg mb-4">
                <QRCodeSVG value={wallet.address} size={172} level="M" />
              </div>
              <div className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
                {wallet.label} Address
              </div>
              <div className="text-text-primary text-xs font-mono break-all text-center mb-3">
                {wallet.address}
              </div>
              <button
                onClick={copyAddress}
                className="px-4 py-2 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-xs font-semibold bg-transparent cursor-pointer transition-colors"
              >
                {copied ? 'Copied!' : 'Copy address'}
              </button>
            </div>

            <div className="bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-primary font-semibold">
                  {formatUSD(usdAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">You will receive</span>
                <span className="text-text-primary font-semibold">
                  {receiveQty.toFixed(8)} {symbol}
                </span>
              </div>
            </div>

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              Transaction hash (TX ID)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter TX hash after sending"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-xs text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue font-mono mb-3"
            />

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              Your email for confirmation
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
            />

            {error && (
              <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !txHash.trim() || !email.trim()}
                className="flex-1 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-colors"
              >
                {submitting ? 'Submitting...' : 'I have sent payment'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-profit/20 mx-auto mb-4 flex items-center justify-center text-3xl text-profit">
              ✓
            </div>
            <div className="text-text-primary font-semibold text-lg mb-2">
              Investment request submitted!
            </div>
            <div className="text-text-muted text-sm mb-5">
              Your account will be credited within 24 hours after verification.
            </div>

            <div className="bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2 text-left mb-5">
              <div className="flex justify-between">
                <span className="text-text-muted">Coin</span>
                <span className="text-text-primary font-semibold">
                  {coin.name} ({symbol})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-primary font-semibold">
                  {formatUSD(usdAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Wallet used</span>
                <span className="text-text-primary font-medium">
                  {wallet.label}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted flex-shrink-0">TX hash</span>
                <span className="text-text-primary font-mono text-xs break-all text-right">
                  {txHash}
                </span>
              </div>
              {submittedAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Submitted</span>
                  <span className="text-text-primary">
                    {new Date(submittedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold border-none cursor-pointer transition-colors"
            >
              Back to Invest
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
