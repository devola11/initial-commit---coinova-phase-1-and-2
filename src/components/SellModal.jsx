import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getCoinPrice } from '../lib/coingecko'
import { calculateSell } from '../utils/calculations'
import { formatUSD, formatCrypto } from '../utils/formatters'
import PINConfirm from './PINConfirm'

const PCT = [25, 50, 75, 100]

export default function SellModal({ holding, onClose }) {
  const { user } = useAuth()
  const { wallet, refreshAll } = usePortfolio()
  const [price, setPrice] = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(true)
  const [pct, setPct] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPinConfirm, setShowPinConfirm] = useState(false)

  useEffect(() => {
    if (!holding?.coin_id) return
    let cancelled = false
    async function load() {
      try {
        const data = await getCoinPrice(holding.coin_id)
        if (!cancelled) setPrice(data[holding.coin_id]?.usd || 0)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoadingPrice(false)
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [holding?.coin_id])

  if (!holding) return null

  const totalQty = Number(holding.quantity)
  const sellQty = (totalQty * pct) / 100
  const calc = price && sellQty > 0 ? calculateSell(sellQty, price) : null
  const buyPrice = Number(holding.buy_price_usd || 0)
  const costBasis = buyPrice * sellQty
  const profit = calc ? calc.netUsd - costBasis : 0
  const profitPct = costBasis > 0 ? (profit / costBasis) * 100 : 0
  const canSubmit = !submitting && price && sellQty > 0

  async function handleConfirm() {
    setError('')
    if (!canSubmit || !user) return
    setSubmitting(true)
    try {
      const remainingQty = totalQty - sellQty

      if (remainingQty <= 0.00000001) {
        const { error: dErr } = await supabase
          .from('holdings')
          .delete()
          .eq('id', holding.id)
        if (dErr) throw dErr
      } else {
        const { error: uErr } = await supabase
          .from('holdings')
          .update({ quantity: remainingQty })
          .eq('id', holding.id)
        if (uErr) throw uErr
      }

      const newBalance = Number(wallet?.balance_usd || 0) + calc.netUsd
      const { error: wErr } = await supabase
        .from('wallet')
        .update({ balance_usd: newBalance })
        .eq('user_id', user.id)
      if (wErr) throw wErr

      const { error: tErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'sell',
        coin_id: holding.coin_id,
        coin_symbol: (holding.coin_symbol || holding.symbol || 'unknown').toUpperCase(),
        quantity: sellQty,
        price_usd: price,
        total_usd: calc.grossUsd,
        fee_usd: calc.fee,
      })
      if (tErr) throw tErr

      await refreshAll()
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to sell')
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
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {holding.coin_image && (
              <img
                src={holding.coin_image}
                alt={holding.symbol}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <div className="text-text-primary font-semibold">
                Sell {holding.name}
              </div>
              <div className="text-text-muted text-xs uppercase">
                {holding.symbol}
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
              Sell complete
            </div>
            <div className="text-text-muted text-sm">
              {formatUSD(calc?.netUsd || 0)} added to wallet
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Live price</span>
              <span className="text-text-primary font-semibold">
                {loadingPrice ? 'Loading...' : formatUSD(price)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Holding</span>
              <span className="text-text-primary">
                {formatCrypto(totalQty)} {holding.symbol?.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-6">
              <span className="text-text-muted">Current value</span>
              <span className="text-text-primary font-semibold">
                {formatUSD(totalQty * (price || 0))}
              </span>
            </div>

            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
              Sell amount
            </label>
            <div className="flex gap-2">
              {PCT.map((p) => (
                <button
                  key={p}
                  onClick={() => setPct(p)}
                  className={`flex-1 px-2 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    pct === p
                      ? 'border-primary-blue text-primary-blue bg-primary-blue/10'
                      : 'border-card-border text-text-primary bg-transparent hover:border-primary-blue'
                  }`}
                >
                  {p === 100 ? 'Max' : `${p}%`}
                </button>
              ))}
            </div>

            {calc && (
              <div className="mt-5 bg-root-bg border border-card-border rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Selling</span>
                  <span className="text-text-primary font-semibold">
                    {formatCrypto(sellQty)} {holding.symbol?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Gross</span>
                  <span className="text-text-primary">{formatUSD(calc.grossUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fee (0.1%)</span>
                  <span className="text-text-primary">{formatUSD(calc.fee)}</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-2">
                  <span className="text-text-muted">You receive</span>
                  <span className="text-text-primary font-semibold">
                    {formatUSD(calc.netUsd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">P&amp;L vs buy</span>
                  <span
                    className={`font-semibold ${profit >= 0 ? 'text-profit' : 'text-loss'}`}
                  >
                    {formatUSD(profit)} ({profit >= 0 ? '+' : ''}
                    {profitPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-loss/10 border border-loss/20 text-loss text-xs rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (localStorage.getItem('coinova-pin-hash')) {
                  setShowPinConfirm(true)
                } else {
                  handleConfirm()
                }
              }}
              disabled={!canSubmit}
              className="w-full mt-5 py-3 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-opacity"
            >
              {submitting ? 'Processing...' : 'Confirm sell'}
            </button>
          </>
        )}
      </div>
      {showPinConfirm && (
        <PINConfirm
          title="Confirm sale"
          subtitle={`Sell ${holding.symbol?.toUpperCase()} with PIN`}
          onVerified={() => { setShowPinConfirm(false); handleConfirm() }}
          onCancel={() => setShowPinConfirm(false)}
        />
      )}
    </div>
  )
}
