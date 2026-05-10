import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useCNCToken } from '../hooks/useCNCToken'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { useAuth } from '../context/AuthContext'
import { formatUSD, formatNumber } from '../utils/formatters'
import { logActivity } from '../utils/activityLogger'
import PriceLockTimer from '../components/PriceLockTimer'
import cncLogo from '../assets/cnc-logo.png'

const WALLETS = {
  btc: 'bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl',
  eth: '0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458',
  usdt_trc20: 'TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca',
}

const NETWORKS = {
  btc: 'Bitcoin Network',
  eth: 'Ethereum Network (ERC-20)',
  usdt_trc20: 'Tron Network (TRC-20)',
}

const SYMBOLS = {
  btc: 'BTC',
  eth: 'ETH',
  usdt_trc20: 'USDT',
}

const EXPLORER_URLS = {
  btc: 'https://blockchain.com/explorer/transactions/btc/',
  eth: 'https://etherscan.io/tx/',
  usdt_trc20: 'https://tronscan.org/#/transaction/',
}

const PAYMENT_METHODS = [
  {
    id: 'btc',
    label: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    description: 'Most popular globally',
  },
  {
    id: 'usdt_trc20',
    label: 'USDT',
    symbol: 'TRC-20',
    color: '#26A17B',
    description: 'Stable, no volatility',
  },
  {
    id: 'eth',
    label: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    description: 'Popular in US/Europe',
  },
]

const CNC_PRICE = 0.05

const GOLD = '#FFD700'
const BLUE = '#0052FF'
const GREEN = '#05B169'
const GREY = '#8A919E'

const PRESALE_PRICE = 0.05
const LAUNCH_PRICE = 0.10
const TOTAL_SUPPLY = 100_000_000

const ALLOCATIONS = [
  { name: 'Public Sale', percent: 50, amount: 50_000_000, color: BLUE },
  { name: 'Platform Reserve', percent: 25, amount: 25_000_000, color: GOLD },
  { name: 'Ecosystem Rewards', percent: 15, amount: 15_000_000, color: GREEN },
  { name: 'Team and Advisors', percent: 10, amount: 10_000_000, color: GREY },
]

const PHASES = [
  {
    key: 1,
    label: 'PHASE 1 COMPLETE',
    title: 'Token Design and Tokenomics',
    state: 'complete',
  },
  {
    key: 2,
    label: 'PHASE 2 ACTIVE NOW',
    title: 'Presale at $0.05 per CNC',
    state: 'active',
  },
  {
    key: 3,
    label: 'Q3 2026',
    title: 'Token Launch at $0.10',
    state: 'upcoming',
  },
  {
    key: 4,
    label: 'Q4 2026',
    title: 'Exchange Listings',
    state: 'upcoming',
  },
]

function StatCard({ label, value, sub, gold }) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        background: '#141519',
        borderColor: gold ? GOLD : '#1E2025',
      }}
    >
      <div className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: '#8A8F98' }}>
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      {sub && <div className="text-xs text-[#8A8F98] mt-1">{sub}</div>}
    </div>
  )
}

function PresaleLiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: 'rgba(5, 177, 105, 0.15)', color: GREEN }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: GREEN, animation: 'cnc-ping 1.5s infinite' }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GREEN }} />
      </span>
      Presale Live
    </span>
  )
}

function WhyHoldCard({ title, desc, icon }) {
  return (
    <div className="rounded-xl p-6" style={{ background: '#141519', border: '1px solid #1E2025' }}>
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ background: 'rgba(255, 215, 0, 0.12)' }}
      >
        {icon}
      </div>
      <div className="text-white font-semibold mb-2">{title}</div>
      <div className="text-[#8A8F98] text-sm">{desc}</div>
    </div>
  )
}

function HowToBuyStep({ n, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold"
        style={{ background: GOLD, color: '#0A0B0D' }}
      >
        {n}
      </div>
      <div>
        <div className="text-white font-semibold mb-1">{title}</div>
        <div className="text-[#8A8F98] text-sm">{desc}</div>
      </div>
    </div>
  )
}

function CountdownBox({ value, label }) {
  return (
    <div
      style={{
        background: '#0A0B0D',
        border: '1px solid #FFD700',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ color: '#FFD700', fontSize: 24, fontWeight: 700 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div
        style={{
          color: '#8A919E',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function PhaseRow({ phase }) {
  const isComplete = phase.state === 'complete'
  const isActive = phase.state === 'active'

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    background: isActive ? '#FFD70010' : '#0A0B0D',
    border: isActive
      ? '2px solid #FFD700'
      : isComplete
      ? '1px solid #05B169'
      : '1px solid #1E2025',
    position: 'relative',
  }

  const circleBg = isComplete ? '#05B169' : isActive ? '#FFD700' : '#1E2025'
  const circleColor = isComplete ? 'white' : isActive ? '#000' : '#8A919E'
  const labelColor = isComplete ? '#05B169' : isActive ? '#FFD700' : '#8A919E'
  const titleColor = isActive || isComplete ? '#fff' : '#E0E2E6'

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: circleBg,
          color: circleColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
          animation: isActive ? 'cnc-pulse 2s infinite' : 'none',
        }}
      >
        {isComplete ? '✓' : phase.key}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: labelColor,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
          }}
        >
          {phase.label}
        </div>
        <div style={{ color: titleColor, fontWeight: 600 }}>{phase.title}</div>
      </div>
      {isActive && (
        <div
          style={{
            background: '#FFD700',
            color: '#000',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          LIVE
        </div>
      )}
    </div>
  )
}

const ONE_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000

function useCountdown() {
  const [countdown, setCountdown] = useState({
    days: 180,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    let endDate = localStorage.getItem('cnc-presale-end')

    if (!endDate) {
      endDate = String(Date.now() + ONE_EIGHTY_DAYS_MS)
      localStorage.setItem('cnc-presale-end', endDate)
    }

    let targetTime = parseInt(endDate, 10)

    function calculate() {
      const now = Date.now()
      const distance = targetTime - now

      if (distance < 0) {
        const newEnd = Date.now() + ONE_EIGHTY_DAYS_MS
        localStorage.setItem('cnc-presale-end', String(newEnd))
        targetTime = newEnd
        return { days: 180, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / (1000 * 60)) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      }
    }

    setCountdown(calculate())
    const interval = setInterval(() => {
      setCountdown(calculate())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return countdown
}

function usePlatformStats() {
  const [stats, setStats] = useState({ users: 0, holders: 0, cncIssued: 0 })

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const [{ count: userCount }, { count: holderCount }, { data: cncSum }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('cnc_holdings')
            .select('*', { count: 'exact', head: true })
            .gt('quantity', 0),
          supabase.from('cnc_holdings').select('quantity'),
        ])
        const totalCNC =
          cncSum?.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0) || 0
        if (!cancelled) {
          setStats({
            users: userCount || 0,
            holders: holderCount || 0,
            cncIssued: totalCNC,
          })
        }
      } catch (err) {
        console.warn('platform stats fetch failed:', err?.message || err)
      }
    }
    fetchStats()
    return () => {
      cancelled = true
    }
  }, [])

  return stats
}

export default function CNCToken() {
  const { user } = useAuth()
  const cnc = useCNCToken()
  const prices = useCryptoPrices()
  const countdown = useCountdown()

  const positive = (Number(cnc.change_24h) || 0) >= 0

  const [paymentMethod, setPaymentMethod] = useState('btc')
  const [usdAmount, setUsdAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [priceLockTime, setPriceLockTime] = useState(null)
  const [lockedPrices, setLockedPrices] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const getCNCAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    return Math.floor(usd / CNC_PRICE)
  }

  const getCryptoAmount = () => {
    const usd = parseFloat(usdAmount) || 0
    const currentPrices = lockedPrices || prices
    if (paymentMethod === 'btc') {
      if (!currentPrices.BTC) return '0'
      return (usd / currentPrices.BTC).toFixed(8)
    }
    if (paymentMethod === 'eth') {
      if (!currentPrices.ETH) return '0'
      return (usd / currentPrices.ETH).toFixed(6)
    }
    return usd.toFixed(2)
  }

  const handleLockPrice = () => {
    if (paymentMethod !== 'usdt_trc20' && !priceLockTime) {
      setLockedPrices({ BTC: prices.BTC, ETH: prices.ETH })
      setPriceLockTime(Date.now())
    }
  }

  const handlePriceExpire = () => {
    setLockedPrices(null)
    setPriceLockTime(null)
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(WALLETS[paymentMethod])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePaymentMethodChange = (methodId) => {
    setPaymentMethod(methodId)
    setLockedPrices(null)
    setPriceLockTime(null)
    setUsdAmount('')
    setError('')
  }

  const handleSubmit = async () => {
    setError('')

    if (!user) {
      setError('Please login to buy CNC')
      return
    }

    const usd = parseFloat(usdAmount)
    if (!usdAmount || usd < 10) {
      setError('Minimum purchase is $10')
      return
    }

    if (!txHash || txHash.trim().length < 20) {
      setError('Please enter a valid transaction hash')
      return
    }

    setSubmitting(true)

    try {
      const { count } = await supabase
        .from('investment_requests')
        .select('*', { count: 'exact', head: true })

      const num = String((count || 0) + 1).padStart(4, '0')
      const reqNum = 'CNC-2026-' + num

      const currentPrices = lockedPrices || prices
      const cryptoAmount = getCryptoAmount()
      const explorerLink = EXPLORER_URLS[paymentMethod] + txHash.trim()

      const { error: dbError } = await supabase
        .from('investment_requests')
        .insert({
          user_id: user.id,
          coin_id: 'coinova-coin',
          coin_name: 'Coinova Coin',
          coin_symbol: 'CNC',
          amount_usd: usd,
          tx_hash: txHash.trim(),
          status: 'pending',
          payment_method: paymentMethod,
          wallet_used: paymentMethod,
          crypto_price_at_submission:
            paymentMethod === 'btc' ? currentPrices.BTC :
            paymentMethod === 'eth' ? currentPrices.ETH : 1,
          crypto_amount_sent: parseFloat(cryptoAmount),
          price_locked_until: priceLockTime
            ? new Date(priceLockTime + 3600000).toISOString()
            : null,
          explorer_link: explorerLink,
          request_number: reqNum,
        })

      if (dbError) throw dbError

      await logActivity({
        userId: user.id,
        action: 'cnc_purchase_submitted',
        description: `CNC purchase: $${usd} via ${SYMBOLS[paymentMethod]}`,
        metadata: { usd, method: paymentMethod, txHash: txHash.trim() },
      })

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to submit. Try again.')
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0B0D' }}>
      <style>{`
        @keyframes cnc-ping {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes cnc-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(0, 82, 255, 0.08))',
            border: `1px solid ${GOLD}40`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img src={cncLogo} alt="CNC" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Coinova Coin</h1>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ background: GOLD, color: '#0A0B0D' }}>
                  CNC
                </span>
                <PresaleLiveBadge />
              </div>
              <div className="text-[#8A8F98] text-sm mb-4">Official Platform Token</div>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#8A8F98] mb-1">Live Price</div>
                  <div className="text-2xl font-bold text-white">{formatUSD(cnc.price)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#8A8F98] mb-1">24h Change</div>
                  <div className="text-2xl font-bold" style={{ color: positive ? GREEN : '#E53935' }}>
                    {positive ? '+' : ''}
                    {Number(cnc.change_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Current Price" value={formatUSD(cnc.price)} />
          <StatCard label="Market Cap" value={`$${formatNumber(cnc.marketCap)}`} />
          <StatCard label="Total Supply" value={`${formatNumber(cnc.total_supply)} CNC`} />
          <StatCard label="Launch Price" value={formatUSD(cnc.launch_price)} sub="Q3 2026" />
        </div>

        {/* TOKEN ROADMAP (phase indicators) */}
        <div
          style={{
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, margin: '0 0 20px 0' }}>
            Token Roadmap
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PHASES.map((p) => (
              <PhaseRow key={p.key} phase={p} />
            ))}
          </div>
        </div>

        {/* COINOVA AT A GLANCE */}
        <div
          style={{
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            Cointehera At A Glance
          </h3>
          <p
            style={{
              color: '#8A919E',
              fontSize: 13,
              margin: '0 0 20px 0',
            }}
          >
            Built for traders who demand more
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#0052FF20',
                  color: '#0052FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                G
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                Global Platform
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                Available in 195 countries
              </div>
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#FFD70020',
                  color: '#FFD700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                C
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                250+ Cryptocurrencies
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                Trade any major coin
              </div>
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#7C3AED20',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                AI
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                AI-Powered Learning
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                Learn any crypto with Claude AI
              </div>
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#05B16920',
                  color: '#05B169',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                S
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                Bank-Level Security
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                2FA, Biometric, KYC verified
              </div>
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#F59E0B20',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                M
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                Available Everywhere
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                PWA, mobile and desktop
              </div>
            </div>

            <div
              style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#F6465D20',
                  color: '#F6465D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                B
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                100 CNC Bonus
              </div>
              <div style={{ color: '#8A919E', fontSize: 13 }}>
                Free for every new user
              </div>
            </div>
          </div>
        </div>

        {/* BE AMONG THE FIRST 1000 HOLDERS */}
        <div
          style={{
            background: 'linear-gradient(135deg, #001a8c 0%, #0052FF 100%)',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            textAlign: 'center',
            border: '2px solid #FFD700',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,215,0,0.15)',
            }}
          />

          <div
            style={{
              color: '#FFD700',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              marginBottom: 12,
            }}
          >
            EARLY SUPPORTER ACCESS
          </div>

          <h2
            style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: 800,
              margin: '0 0 12px 0',
              lineHeight: 1.2,
            }}
          >
            Be Among the First 1,000 Holders
          </h2>

          <p
            style={{
              color: '#a0c4ff',
              fontSize: 15,
              margin: '0 auto 24px',
              maxWidth: 480,
            }}
          >
            Get founder status when you buy CNC during presale. Limited time
            offer ends when phase closes.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 24,
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700 }}>
                FOUNDER BADGE
              </div>
              <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                Permanent profile badge
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700 }}>
                50% PRESALE DISCOUNT
              </div>
              <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                Buy at $0.05 vs $0.10 launch
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700 }}>
                PRIORITY SUPPORT
              </div>
              <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                Faster response times
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 700 }}>
                EARLY FEATURE ACCESS
              </div>
              <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                Test new features first
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              document
                .querySelector('.presale-card')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              background: '#FFD700',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Get my CNC now
          </button>
        </div>

        {/* PRESALE CARD */}
        <div className="presale-card" style={{
          background: '#141519',
          border: '2px solid #FFD700',
          borderRadius: 20,
          padding: 28,
          marginBottom: 24,
        }}>
          {!submitted ? (
            <>
              <h2 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: 22, fontWeight: 700 }}>
                Buy Coinova Coin (CNC)
              </h2>
              <p style={{ color: '#8A919E', margin: '0 0 16px 0', fontSize: 14 }}>
                Presale price $0.05 - 50% off launch price
              </p>

              {/* Countdown timer */}
              <div className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: '#8A8F98' }}>
                Presale ends in
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                marginBottom: 24,
              }}>
                <CountdownBox value={countdown.days} label="Days" />
                <CountdownBox value={countdown.hours} label="Hours" />
                <CountdownBox value={countdown.minutes} label="Minutes" />
                <CountdownBox value={countdown.seconds} label="Seconds" />
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  color: '#8A919E',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  marginBottom: 10,
                }}>
                  SELECT PAYMENT METHOD
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}>
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentMethodChange(method.id)}
                      style={{
                        padding: '14px 8px',
                        background: paymentMethod === method.id ? method.color + '20' : '#0A0B0D',
                        border: `2px solid ${paymentMethod === method.id ? method.color : '#1E2025'}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        color: paymentMethod === method.id ? method.color : '#fff',
                        fontWeight: 700,
                        fontSize: 15,
                      }}>
                        {method.label}
                      </div>
                      <div style={{ color: '#8A919E', fontSize: 10, marginTop: 2 }}>
                        {method.symbol}
                      </div>
                      {method.id === 'btc' && (
                        <div style={{
                          background: '#F7931A',
                          color: '#000',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginTop: 4,
                          display: 'inline-block',
                        }}>
                          POPULAR
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE PRICE FOR BTC AND ETH */}
              {paymentMethod !== 'usdt_trc20' && (
                <div style={{
                  background: '#0A0B0D',
                  border: '1px solid #1E2025',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ color: '#8A919E', fontSize: 11, fontWeight: 600 }}>
                      LIVE {SYMBOLS[paymentMethod]} PRICE
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginTop: 2 }}>
                      {prices.loading
                        ? 'Loading...'
                        : '$' + (paymentMethod === 'btc'
                            ? (lockedPrices?.BTC || prices.BTC)?.toLocaleString()
                            : (lockedPrices?.ETH || prices.ETH)?.toLocaleString())
                      }
                    </div>
                  </div>
                  <div style={{ color: '#8A919E', fontSize: 11, textAlign: 'right' }}>
                    {lockedPrices ? 'Price locked' : 'Updates every 60s'}
                  </div>
                </div>
              )}

              {/* USD AMOUNT */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  color: '#8A919E',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 8,
                }}>
                  HOW MUCH DO YOU WANT TO SPEND? (USD)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8A919E',
                    fontSize: 18,
                    fontWeight: 700,
                  }}>$</span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    onFocus={handleLockPrice}
                    placeholder="0.00"
                    min="10"
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 36px',
                      background: '#0A0B0D',
                      border: '1px solid #1E2025',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  />
                </div>

                {/* QUICK AMOUNTS */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {[10, 25, 50, 100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setUsdAmount(amt.toString())
                        handleLockPrice()
                      }}
                      style={{
                        padding: '6px 14px',
                        background: parseFloat(usdAmount) === amt ? '#FFD70020' : '#0A0B0D',
                        border: `1px solid ${parseFloat(usdAmount) === amt ? '#FFD700' : '#1E2025'}`,
                        borderRadius: 6,
                        color: parseFloat(usdAmount) === amt ? '#FFD700' : '#8A919E',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* CALCULATION SUMMARY */}
              {usdAmount && parseFloat(usdAmount) >= 10 && (
                <div style={{
                  background: '#0A0B0D',
                  border: '1px solid #FFD700',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 12,
                    textAlign: 'center',
                  }}>
                    <div>
                      <div style={{ color: '#8A919E', fontSize: 11, fontWeight: 600 }}>
                        YOU PAY
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                        {paymentMethod === 'usdt_trc20'
                          ? `$${parseFloat(usdAmount).toFixed(2)}`
                          : `${getCryptoAmount()} ${SYMBOLS[paymentMethod]}`
                        }
                      </div>
                    </div>
                    <div style={{ borderLeft: '1px solid #1E2025', borderRight: '1px solid #1E2025' }}>
                      <div style={{ color: '#8A919E', fontSize: 11, fontWeight: 600 }}>
                        AT PRICE
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                        $0.05/CNC
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#8A919E', fontSize: 11, fontWeight: 600 }}>
                        YOU RECEIVE
                      </div>
                      <div style={{ color: '#FFD700', fontWeight: 800, fontSize: 18, marginTop: 4 }}>
                        {getCNCAmount().toLocaleString()} CNC
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRICE LOCK TIMER */}
              {priceLockTime && paymentMethod !== 'usdt_trc20' && (
                <div style={{ marginBottom: 16 }}>
                  <PriceLockTimer
                    lockedAt={priceLockTime}
                    onExpire={handlePriceExpire}
                  />
                </div>
              )}

              {/* WALLET + QR CODE */}
              <div style={{
                background: '#0A0B0D',
                border: '1px solid #1E2025',
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
              }}>
                <div style={{
                  color: '#8A919E',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  marginBottom: 16,
                }}>
                  SEND {SYMBOLS[paymentMethod]} TO THIS ADDRESS ({NETWORKS[paymentMethod]})
                </div>

                {/* QR CODE */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
                    <QRCodeSVG
                      value={WALLETS[paymentMethod]}
                      size={180}
                      level="M"
                    />
                  </div>
                </div>

                {/* WALLET ADDRESS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#141519',
                  border: '1px solid #1E2025',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 12,
                }}>
                  <span style={{
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    flex: 1,
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                  }}>
                    {WALLETS[paymentMethod]}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    style={{
                      background: copied ? '#05B169' : '#0052FF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* NETWORK WARNING */}
                <div style={{
                  background: '#F59E0B10',
                  border: '1px solid #F59E0B',
                  borderRadius: 8,
                  padding: 10,
                  color: '#F59E0B',
                  fontSize: 12,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ flexShrink: 0 }}>!</span>
                  <span>
                    Send ONLY {SYMBOLS[paymentMethod]} on the {NETWORKS[paymentMethod]}.
                    Sending wrong coin or wrong network will result in permanent loss of funds.
                  </span>
                </div>
              </div>

              {/* TX HASH INPUT */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  color: '#8A919E',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 8,
                }}>
                  TRANSACTION HASH (paste after sending)
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste your TX hash here..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#0A0B0D',
                    border: '1px solid #1E2025',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                />
                <div style={{ color: '#8A919E', fontSize: 11, marginTop: 6 }}>
                  Verify your transaction on{' '}
                  {paymentMethod === 'btc' && (
                    <a
                      href="https://blockchain.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0052FF' }}
                    >
                      blockchain.com
                    </a>
                  )}
                  {paymentMethod === 'eth' && (
                    <a
                      href="https://etherscan.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0052FF' }}
                    >
                      etherscan.io
                    </a>
                  )}
                  {paymentMethod === 'usdt_trc20' && (
                    <a
                      href="https://tronscan.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0052FF' }}
                    >
                      tronscan.org
                    </a>
                  )}
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div style={{
                  padding: 14,
                  background: '#F6465D15',
                  border: '1px solid #F6465D',
                  borderRadius: 10,
                  color: '#F6465D',
                  fontSize: 14,
                  marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              {/* LOGIN PROMPT */}
              {!user && (
                <div style={{
                  background: '#0052FF15',
                  border: '1px solid #0052FF',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  <Link to="/login" style={{ color: '#0052FF', fontWeight: 700 }}>
                    Login
                  </Link>
                  {' '}or{' '}
                  <Link to="/register" style={{ color: '#0052FF', fontWeight: 700 }}>
                    Create account
                  </Link>
                  {' '}to buy CNC
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !usdAmount || !txHash || parseFloat(usdAmount) < 10}
                style={{
                  width: '100%',
                  padding: 18,
                  background: (submitting || !usdAmount || !txHash) ? '#1E2025' : '#FFD700',
                  color: (submitting || !usdAmount || !txHash) ? '#8A919E' : '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: (submitting || !usdAmount || !txHash) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {submitting
                  ? 'Submitting...'
                  : user
                    ? 'Submit Payment'
                    : 'Login to Buy CNC'
                }
              </button>

              <div style={{ textAlign: 'center', marginTop: 12, color: '#8A919E', fontSize: 12 }}>
                Processing time: Up to 24 hours after submission
              </div>
            </>
          ) : (
            /* SUCCESS STATE */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#05B16920',
                border: '2px solid #05B169',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                color: '#05B169',
              }}>
                ✓
              </div>

              <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: 24, fontWeight: 700 }}>
                Payment Submitted!
              </h3>

              <p style={{ color: '#8A919E', marginBottom: 24, fontSize: 15 }}>
                We will verify and credit your CNC within 24 hours
              </p>

              <div style={{
                background: '#0A0B0D',
                border: '1px solid #FFD700',
                borderRadius: 14,
                padding: 20,
                marginBottom: 24,
                textAlign: 'left',
              }}>
                <div style={{
                  color: '#FFD700',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  marginBottom: 16,
                }}>
                  PURCHASE SUMMARY
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #1E2025',
                }}>
                  <span style={{ color: '#8A919E' }}>Amount paid</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    ${parseFloat(usdAmount).toFixed(2)} USD
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #1E2025',
                }}>
                  <span style={{ color: '#8A919E' }}>Paid with</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    {SYMBOLS[paymentMethod]} ({NETWORKS[paymentMethod]})
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #1E2025',
                }}>
                  <span style={{ color: '#8A919E' }}>CNC price</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>$0.05 per CNC</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0 0',
                }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>CNC to receive</span>
                  <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 20 }}>
                    {getCNCAmount().toLocaleString()} CNC
                  </span>
                </div>
              </div>

              <div style={{
                background: '#05B16910',
                border: '1px solid #05B169',
                borderRadius: 10,
                padding: 12,
                color: '#05B169',
                fontSize: 13,
                marginBottom: 24,
              }}>
                You will receive an email confirmation once your payment is verified.
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setTxHash('')
                    setUsdAmount('')
                    setPriceLockTime(null)
                    setLockedPrices(null)
                    setError('')
                  }}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Buy More CNC
                </button>
                <Link
                  to="/dashboard"
                  style={{
                    flex: 1,
                    padding: 14,
                    background: '#1E2025',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* WHY HOLD CNC */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Why Hold CNC</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <WhyHoldCard
            title="Fee Discounts"
            desc="Hold CNC to receive up to 50% off trading and withdrawal fees on Cointehera."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>}
          />
          <WhyHoldCard
            title="Staking Rewards"
            desc="Stake CNC and earn up to 18% APY with flexible or locked terms."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          />
          <WhyHoldCard
            title="VIP Benefits"
            desc="Unlock airdrops, early access to new features, and priority KYC review."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          />
        </div>

        {/* TOKEN ECONOMICS with dollar values */}
        <div
          style={{
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
            Token Economics
          </h3>
          <p style={{ color: '#8A919E', fontSize: 13, margin: '0 0 24px 0' }}>
            {TOTAL_SUPPLY.toLocaleString()} CNC fixed supply
          </p>

          {/* Project Valuation */}
          <div
            style={{
              background: '#0A0B0D',
              border: '1px solid #FFD700',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                color: '#FFD700',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: 16,
              }}
            >
              PROJECT VALUATION
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={{ color: '#8A919E', fontSize: 11, marginBottom: 4 }}>At Presale Price</div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>
                  ${(TOTAL_SUPPLY * PRESALE_PRICE).toLocaleString()}
                </div>
                <div style={{ color: '#8A919E', fontSize: 11, marginTop: 2 }}>
                  ${PRESALE_PRICE.toFixed(2)} per CNC
                </div>
              </div>

              <div>
                <div style={{ color: '#8A919E', fontSize: 11, marginBottom: 4 }}>At Launch Price</div>
                <div style={{ color: '#FFD700', fontSize: 24, fontWeight: 700 }}>
                  ${(TOTAL_SUPPLY * LAUNCH_PRICE).toLocaleString()}
                </div>
                <div style={{ color: '#8A919E', fontSize: 11, marginTop: 2 }}>
                  ${LAUNCH_PRICE.toFixed(2)} per CNC
                </div>
              </div>

              <div>
                <div style={{ color: '#8A919E', fontSize: 11, marginBottom: 4 }}>Potential Growth</div>
                <div style={{ color: '#05B169', fontSize: 24, fontWeight: 700 }}>+100%</div>
                <div style={{ color: '#8A919E', fontSize: 11, marginTop: 2 }}>Doubles at launch</div>
              </div>
            </div>
          </div>

          {/* Distribution heading */}
          <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>
            Token Distribution
          </h4>

          {/* Allocations with dollar amounts */}
          {ALLOCATIONS.map((item) => {
            const usdValue = item.amount * PRESALE_PRICE
            const launchValue = item.amount * LAUNCH_PRICE

            return (
              <div
                key={item.name}
                style={{
                  background: '#0A0B0D',
                  border: '1px solid #1E2025',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.name}</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{item.percent}%</span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 8,
                    alignItems: 'center',
                    paddingLeft: 22,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#8A919E' }}>{item.amount.toLocaleString()} CNC</span>
                  <span style={{ color: '#FFD700', fontWeight: 600 }}>
                    ${usdValue.toLocaleString()}
                  </span>
                  <span style={{ color: '#5B616E', fontSize: 11 }}>at presale</span>
                </div>

                <div
                  style={{
                    paddingLeft: 22,
                    marginTop: 4,
                    fontSize: 11,
                    color: '#5B616E',
                  }}
                >
                  ${launchValue.toLocaleString()} at launch price
                </div>
              </div>
            )
          })}
        </div>

        {/* WHAT YOU COULD EARN - calculator */}
        <div
          style={{
            background: '#141519',
            border: '1px solid #FFD700',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>
            What you could earn
          </h3>

          <div style={{ background: '#0A0B0D', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: '#8A919E', fontSize: 12, marginBottom: 8 }}>
              Investment scenarios at presale (${PRESALE_PRICE.toFixed(2)}):
            </div>

            {[10, 50, 100, 500, 1000].map((amount) => {
              const cncAmount = amount / PRESALE_PRICE
              const launchValue = cncAmount * LAUNCH_PRICE
              return (
                <div
                  key={amount}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    padding: '10px 0',
                    borderBottom: '1px solid #1E2025',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#8A919E', fontSize: 11 }}>You pay</div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>${amount}</div>
                  </div>
                  <div>
                    <div style={{ color: '#8A919E', fontSize: 11 }}>You receive</div>
                    <div style={{ color: '#FFD700', fontWeight: 700 }}>
                      {cncAmount.toLocaleString()} CNC
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#8A919E', fontSize: 11 }}>At launch</div>
                    <div style={{ color: '#05B169', fontWeight: 700 }}>
                      ${launchValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: '#FFD70010',
              border: '1px solid #FFD700',
              borderRadius: 10,
              padding: 12,
              color: '#FFD700',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Buy at presale, double your money at launch!
          </div>
        </div>

        {/* HOW TO BUY */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">How to Buy CNC</h2>
        <div className="rounded-xl p-6 sm:p-8 mb-12 space-y-5" style={{ background: '#141519', border: '1px solid #1E2025' }}>
          <HowToBuyStep n={1} title="Create a Cointehera account" desc="Sign up in under 60 seconds." />
          <HowToBuyStep n={2} title="Visit the CNC page" desc="Open /cnc to access the presale dashboard." />
          <HowToBuyStep n={3} title="Choose your amount" desc="Enter USD amount or pick a quick preset." />
          <HowToBuyStep n={4} title="Send USDT TRC-20" desc="Scan the QR or copy the treasury address." />
          <HowToBuyStep n={5} title="Submit TX hash" desc="Receive your CNC within 24 hours after verification." />
        </div>
      </div>
    </div>
  )
}
