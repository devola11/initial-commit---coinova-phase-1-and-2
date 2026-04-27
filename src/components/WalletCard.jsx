import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePortfolio } from '../context/PortfolioContext'
import { useAuth } from '../context/AuthContext'
import { useKycStatus } from './KYCBanner'
import { formatUSD } from '../utils/formatters'
import FundWalletModal from './FundWalletModal'

function DemoCard() {
  const { user } = useAuth()
  const { wallet, fetchWallet } = usePortfolio()
  const [loading, setLoading] = useState(false)

  async function addFunds() {
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
      alert('Failed to add demo funds: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      }}
    >
      <span
        className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
        style={{ background: '#F59E0B', color: '#0A0B0D' }}
      >
        DEMO
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: '#F59E0B' }}>
          Demo Account
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {formatUSD(wallet?.balance_usd || 0)}
        </div>
        <div className="text-xs text-text-muted mt-1">Practice funds · USD</div>
      </div>
      <button
        onClick={addFunds}
        disabled={loading}
        className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 border-none cursor-pointer whitespace-nowrap"
        style={{ background: '#F59E0B', color: '#0A0B0D' }}
      >
        {loading ? 'Adding...' : '+ Add $1,000 demo funds'}
      </button>
      <div className="text-[11px] text-text-muted">For learning and practice</div>
    </div>
  )
}

function WalletCardInner({ onFund, onWithdraw }) {
  const { wallet } = usePortfolio()
  const { kycStatus } = useKycStatus()
  const balance = Number(wallet?.wallet_balance || 0)
  const isVerified = kycStatus === 'approved'

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.08), rgba(0, 82, 255, 0.02))',
        border: '1px solid rgba(0, 82, 255, 0.35)',
      }}
    >
      <span
        className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
        style={{ background: '#0052FF', color: '#FFFFFF' }}
      >
        WALLET
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: '#0052FF' }}>
          Main Wallet
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {formatUSD(balance)}
        </div>
        <div className="text-xs text-text-muted mt-1">Real crypto funds</div>
      </div>
      {!isVerified ? (
        <Link
          to="/kyc"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer whitespace-nowrap no-underline text-center"
          style={{ background: '#0052FF', color: '#FFFFFF' }}
        >
          Complete KYC to fund
        </Link>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onFund}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-opacity border-none cursor-pointer whitespace-nowrap"
            style={{ background: '#0052FF', color: '#FFFFFF' }}
          >
            + Fund
          </button>
          <button
            onClick={onWithdraw}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            style={{
              background: 'transparent',
              color: '#0052FF',
              border: '1px solid #0052FF',
            }}
          >
            Withdraw
          </button>
        </div>
      )}
      <div className="text-[11px] text-text-muted">
        {balance > 0 ? 'Ready for real trading' : 'Fund with real crypto'}
      </div>
    </div>
  )
}

export default function WalletCard({ onWithdraw }) {
  const [fundOpen, setFundOpen] = useState(false)
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DemoCard />
        <WalletCardInner onFund={() => setFundOpen(true)} onWithdraw={onWithdraw} />
      </div>
      {fundOpen && <FundWalletModal onClose={() => setFundOpen(false)} />}
    </>
  )
}
