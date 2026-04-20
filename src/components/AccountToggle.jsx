import { useAccountMode } from '../hooks/useAccountMode'
import { usePortfolio } from '../context/PortfolioContext'
import { formatUSD } from '../utils/formatters'

export default function AccountToggle({ compact = false, className = '' }) {
  const { isDemo, isWallet, switchMode } = useAccountMode()
  const { wallet } = usePortfolio()

  const demoBalance = Number(wallet?.balance_usd || 0)
  const walletBalance = Number(wallet?.wallet_balance || 0)

  const pad = compact ? 'px-3 py-1.5' : 'px-4 py-2 sm:px-5 sm:py-2.5'
  const labelSize = compact ? 'text-[11px]' : 'text-xs sm:text-sm'
  const balSize = compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-card-bg border border-card-border ${className}`}
    >
      <button
        type="button"
        onClick={() => switchMode('demo')}
        className={`${pad} rounded-lg border-none cursor-pointer transition-colors font-semibold flex flex-col items-start leading-tight`}
        style={{
          background: isDemo ? '#F59E0B' : 'transparent',
          color: isDemo ? '#0A0B0D' : '#8A919E',
        }}
      >
        <span className={labelSize}>Demo Account</span>
        {!compact && (
          <span className={`${balSize} font-medium`} style={{ opacity: isDemo ? 0.85 : 0.7 }}>
            {formatUSD(demoBalance)}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => switchMode('wallet')}
        className={`${pad} rounded-lg border-none cursor-pointer transition-colors font-semibold flex flex-col items-start leading-tight`}
        style={{
          background: isWallet ? '#0052FF' : 'transparent',
          color: isWallet ? '#FFFFFF' : '#8A919E',
        }}
      >
        <span className={labelSize}>Main Wallet</span>
        {!compact && (
          <span className={`${balSize} font-medium`} style={{ opacity: isWallet ? 0.9 : 0.7 }}>
            {formatUSD(walletBalance)}
          </span>
        )}
      </button>
    </div>
  )
}
