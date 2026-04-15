import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePortfolio } from '../context/PortfolioContext'
import { useAuth } from '../context/AuthContext'
import { formatUSD } from '../utils/formatters'
import { useLanguage } from '../hooks/useLanguage'

export default function WalletCard() {
  const { user } = useAuth()
  const { wallet, fetchWallet } = usePortfolio()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  async function handleAddFunds() {
    if (!user || !wallet) return
    setLoading(true)
    try {
      const newBalance = Number(wallet.balance_usd || 0) + 1000
      const { error } = await supabase
        .from('wallet')
        .update({ balance_usd: newBalance })
        .eq('user_id', user.id)
      if (error) throw error
      await fetchWallet()
    } catch (err) {
      console.error(err)
      alert('Failed to add funds: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted font-medium mb-2">
          {t.walletBalance}
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          {formatUSD(wallet?.balance_usd || 0)}
        </div>
        <div className="mt-1 text-xs text-text-muted">Demo funds · USD</div>
      </div>
      <button
        onClick={handleAddFunds}
        disabled={loading}
        className="px-5 py-3 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 border-none cursor-pointer whitespace-nowrap"
      >
        {loading ? 'Adding...' : '+ Add $1,000'}
      </button>
    </div>
  )
}
