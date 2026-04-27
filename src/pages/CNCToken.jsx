import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCNCToken } from '../hooks/useCNCToken'
import { useAuth } from '../context/AuthContext'
import { formatUSD, formatNumber } from '../utils/formatters'
import InvestModal from '../components/InvestModal'
import { INVEST_WALLETS } from './Invest'
import cncLogo from '../assets/cnc-logo.png'

const GOLD = '#FFD700'
const BLUE = '#0052FF'
const GREEN = '#05B169'
const GREY = '#8A919E'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

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

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function useCountdown() {
  const [countdown, setCountdown] = useState({
    days: 90,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    let endDate = localStorage.getItem('cnc-presale-end')

    if (!endDate) {
      endDate = String(Date.now() + NINETY_DAYS_MS)
      localStorage.setItem('cnc-presale-end', endDate)
    }

    let targetTime = parseInt(endDate, 10)

    function calculate() {
      const now = Date.now()
      const distance = targetTime - now

      if (distance < 0) {
        const newEnd = Date.now() + NINETY_DAYS_MS
        localStorage.setItem('cnc-presale-end', String(newEnd))
        targetTime = newEnd
        return { days: 90, hours: 0, minutes: 0, seconds: 0 }
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
  const [usd, setUsd] = useState('')
  const [showInvest, setShowInvest] = useState(false)
  const countdown = useCountdown()

  const usdAmount = Number(usd) || 0
  const receiveQty = cnc.price > 0 && usdAmount > 0 ? usdAmount / cnc.price : 0
  const positive = (Number(cnc.change_24h) || 0) >= 0

  const investCoin = {
    id: 'coinova-coin',
    name: 'Coinova Coin',
    symbol: 'CNC',
    image: '/cnc-logo-192.png',
    current_price: cnc.price,
    wallet_used: 'usdt_trc20',
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
            Coinova At A Glance
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
        <div className="presale-card rounded-2xl p-6 sm:p-8 mb-8" style={{ background: '#141519', border: `2px solid ${GOLD}` }}>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white tracking-tight">Buy CNC at Presale Price</h2>
            <PresaleLiveBadge />
          </div>
          <p className="text-[#8A8F98] mb-6">Get 50% discount before launch</p>

          {/* Countdown timer */}
          <div className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: '#8A8F98' }}>
            Presale ends in
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <CountdownBox value={countdown.days} label="Days" />
            <CountdownBox value={countdown.hours} label="Hours" />
            <CountdownBox value={countdown.minutes} label="Minutes" />
            <CountdownBox value={countdown.seconds} label="Seconds" />
          </div>

          {/* Price comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg p-4" style={{ background: '#0A0B0D', border: '1px solid #1E2025' }}>
              <div className="text-[10px] uppercase tracking-widest text-[#8A8F98] mb-1">Presale Price</div>
              <div className="text-xl font-bold" style={{ color: GOLD }}>{formatUSD(cnc.price)}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#0A0B0D', border: '1px solid #1E2025' }}>
              <div className="text-[10px] uppercase tracking-widest text-[#8A8F98] mb-1">Launch Price</div>
              <div className="text-xl font-bold text-white">{formatUSD(cnc.launch_price)}</div>
            </div>
          </div>

          {/* Why buy now */}
          <div
            className="rounded-xl mb-6"
            style={{ background: '#0A0B0D', border: '1px solid #1E2025', padding: 20 }}
          >
            <div className="text-white font-semibold mb-3">Why buy now</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#E0E2E6' }} className="space-y-1.5 text-sm">
              <li>100% potential gain at launch ($0.05 → $0.10)</li>
              <li>Early supporter benefits</li>
              <li>Limited time presale</li>
            </ul>
          </div>

          <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">
            Amount (USD)
          </label>
          <input
            type="number"
            min="0"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg px-4 py-3 text-lg text-white placeholder-[#50555c] focus:outline-none transition-colors"
            style={{ background: '#0A0B0D', border: '1px solid #1E2025' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#1E2025')}
          />

          <div className="flex gap-2 mt-3 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setUsd(String(amt))}
                className="flex-1 min-w-[60px] px-2 py-2 rounded-lg text-white text-xs font-semibold bg-transparent cursor-pointer transition-colors"
                style={{ border: '1px solid #1E2025' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E2025')}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-lg p-4 text-sm" style={{ background: '#0A0B0D', border: '1px solid #1E2025' }}>
            <div className="flex justify-between">
              <span className="text-[#8A8F98]">You will receive</span>
              <span className="font-semibold" style={{ color: GOLD }}>
                {receiveQty > 0 ? formatNumber(receiveQty, 2) : '0'} CNC
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowInvest(true)}
            disabled={!user || usdAmount <= 0}
            className="w-full mt-5 py-3.5 rounded-lg text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors border-none"
            style={{ background: BLUE }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = '#0046D9')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = BLUE)}
          >
            {user ? 'Buy CNC' : 'Sign in to buy'}
          </button>
          {!user && (
            <div className="text-center mt-3">
              <Link to="/register" className="text-sm font-semibold" style={{ color: GOLD }}>
                Create an account →
              </Link>
            </div>
          )}
        </div>

        {/* WHY HOLD CNC */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Why Hold CNC</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <WhyHoldCard
            title="Fee Discounts"
            desc="Hold CNC to receive up to 50% off trading and withdrawal fees on Coinova."
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
          <HowToBuyStep n={1} title="Create a Coinova account" desc="Sign up in under 60 seconds." />
          <HowToBuyStep n={2} title="Visit the CNC page" desc="Open /cnc to access the presale dashboard." />
          <HowToBuyStep n={3} title="Choose your amount" desc="Enter USD amount or pick a quick preset." />
          <HowToBuyStep n={4} title="Send USDT TRC-20" desc="Scan the QR or copy the treasury address." />
          <HowToBuyStep n={5} title="Submit TX hash" desc="Receive your CNC within 24 hours after verification." />
        </div>
      </div>

      {showInvest && (
        <InvestModal
          coin={investCoin}
          wallets={INVEST_WALLETS}
          onClose={() => setShowInvest(false)}
        />
      )}
    </div>
  )
}
