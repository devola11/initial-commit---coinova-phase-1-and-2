import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getCoinPrice } from '../lib/coingecko'
import { calculateBuy } from '../utils/calculations'
import { formatUSD, formatCrypto } from '../utils/formatters'

const QUICK_AMOUNTS = [100, 500, 1000, 5000]

export default function BuyModal({ coin, onClose }) {
  const { user } = useAuth()
  const { wallet, holdings, refreshAll } = usePortfolio()
  const [usd, setUsd] = useState('')
  const [price, setPrice] = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!coin?.id) return
    let cancelled = false
    async function load() {
      try {
        const data = await getCoinPrice(coin.id)
        if (!cancelled) setPrice(data[coin.id]?.usd || 0)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoadingPrice(false)
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [coin?.id])

  if (!coin) return null

  const usdAmount = Number(usd) || 0
  const calc = price && usdAmount > 0 ? calculateBuy(usdAmount, price) : null
  const balance = Number(wallet?.balance_usd || 0)
  const insufficient = usdAmount > balance
  const canSubmit =
    !submitting && price && usdAmount > 0 && !insufficient && calc

  async function handleConfirm() {
    setError('')
    if (!canSubmit || !user) return
    setSubmitting(true)
    try {
      // Deduct from wallet
      const newBalance = balance - usdAmount
      const { error: walletErr } = await supabase
        .from('wallet')
        .update({ balance_usd: newBalance })
        .eq('user_id', user.id)
      if (walletErr) throw walletErr

      // Insert or update holdings (weighted avg buy price)
      const existing = holdings.find((h) => h.coin_id === coin.id)
      if (existing) {
        const totalQty = Number(existing.quantity) + calc.quantity
        const totalCost =
          Number(existing.buy_price_usd) * Number(existing.quantity) +
          price * calc.quantity
        const newAvgPrice = totalCost / totalQty
        const { error: hErr } = await supabase
          .from('holdings')
          .update({ quantity: totalQty, buy_price_usd: newAvgPrice })
          .eq('id', existing.id)
        if (hErr) throw hErr
      } else {
        const { error: hErr } = await supabase.from('holdings').insert({
          user_id: user.id,
          coin_id: coin.id,
          symbol: (coin.symbol || '').toLowerCase(),
          name: coin.name,
          coin_image: coin.image || coin.large || coin.thumb || null,
          quantity: calc.quantity,
          buy_price_usd: price,
        })
        if (hErr) throw hErr
      }

      // Transaction record
      const { error: tErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'buy',
        coin_id: coin.id,
        coin_symbol: (coin.symbol || 'unknown').toUpperCase(),
        quantity: calc.quantity,
        price_usd: price,
        total_usd: usdAmount,
        fee_usd: calc.fee,
      })
      if (tErr) throw tErr

      await refreshAll()
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to complete purchase')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(coin.image || coin.large) && (
              <img
                src={coin.image || coin.large}
                alt={coin.symbol}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <div className="text-text-primary font-semibold">
                Buy {coin.name}
              </div>
              <div className="text-text-muted text-xs uppercase">
                {coin.symbol}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-profit/20 mx-auto mb-4 flex items-center justify-center text-2xl">
              ✓
            </div>
            <div className="text-text-primary font-semibold mb-1">
              Purchase successful
            </div>
            <div className="text-text-muted text-sm">
              {formatCrypto(calc?.quantity || 0)} {coin.symbol?.toUpperCase()} added to your portfolio
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-text-muted">Live price</span>
              <span className="text-text-primary font-semibold">
                {loadingPrice ? 'Loading...' : formatUSD(price)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-6">
              <span className="text-text-muted">Wallet balance</span>
              <span className="text-text-primary font-semibold">
                {formatUSD(balance)}
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
            <div className="flex gap-2 mt-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setUsd(String(amt))}
                  className="flex-1 px-2 py-2 rounded-lg border border-card-border text-text-primary text-xs font-semibold bg-transparent hover:border-primary-blue cursor-pointer transition-colors"
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>

            {calc && (
              <div className="mt-5 bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">You receive</span>
                  <span className="text-text-primary font-semibold">
                    {formatCrypto(calc.quantity)} {coin.symbol?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fee (0.1%)</span>
                  <span className="text-text-primary">{formatUSD(calc.fee)}</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-2">
                  <span className="text-text-muted">Total</span>
                  <span className="text-text-primary font-semibold">
                    {formatUSD(usdAmount)}
                  </span>
                </div>
              </div>
            )}

            {insufficient && (
              <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                Insufficient wallet balance
              </div>
            )}
            {error && (
              <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="w-full mt-5 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-colors"
            >
              {submitting ? 'Processing...' : 'Confirm buy'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
