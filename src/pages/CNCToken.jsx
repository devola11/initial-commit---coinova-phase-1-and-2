import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
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

const TOKENOMICS = [
  { name: 'Public Sale', value: 50, color: BLUE },
  { name: 'Platform Reserve', value: 25, color: GOLD },
  { name: 'Ecosystem', value: 15, color: GREEN },
  { name: 'Team', value: 10, color: GREY },
]

const ROADMAP = [
  { q: 'Q2 2026', title: 'Presale Launch', desc: 'CNC available for early buyers at $0.05', status: 'active' },
  { q: 'Q3 2026', title: 'CNC Launch $0.10', desc: 'Public launch - price doubles at listing.', status: 'upcoming' },
  { q: 'Q4 2026', title: 'First Token Burn', desc: 'Supply reduction event for all holders.', status: 'upcoming' },
  { q: 'Q1 2027', title: 'Exchange Listings', desc: 'CNC listed on Tier-1 centralized exchanges.', status: 'upcoming' },
  { q: 'Q2 2027', title: 'Blockchain Deployment', desc: 'Full on-chain migration with staking contracts.', status: 'upcoming' },
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
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(5, 177, 105, 0.15)', color: GREEN }}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: GREEN, animation: 'cnc-ping 1.5s infinite' }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GREEN }} />
      </span>
      Presale Live
    </span>
  )
}

function WhyHoldCard({ title, desc, icon }) {
  return (
    <div className="rounded-xl p-6" style={{ background: '#141519', border: '1px solid #1E2025' }}>
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255, 215, 0, 0.12)' }}>
        {icon}
      </div>
      <div className="text-white font-semibold mb-2">{title}</div>
      <div className="text-[#8A8F98] text-sm">{desc}</div>
    </div>
  )
}

function RoadmapItem({ item, isLast }) {
  const active = item.status === 'active'
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-4 h-4 rounded-full mt-1" style={{ background: active ? GOLD : '#2a2d33', boxShadow: active ? `0 0 0 4px rgba(255, 215, 0, 0.25)` : 'none' }} />
        {!isLast && <div className="w-[2px] flex-1 mt-1" style={{ background: '#2a2d33' }} />}
      </div>
      <div className={`pb-8 ${active ? '' : ''}`}>
        <div className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: active ? GOLD : '#8A8F98' }}>
          {item.q}
        </div>
        <div className={`font-semibold mb-1 ${active ? '' : ''}`} style={{ color: active ? GOLD : '#FFF' }}>
          {item.title}
        </div>
        <div className="text-[#8A8F98] text-sm max-w-md">{item.desc}</div>
      </div>
    </div>
  )
}

function HowToBuyStep({ n, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: GOLD, color: '#0A0B0D' }}>
        {n}
      </div>
      <div>
        <div className="text-white font-semibold mb-1">{title}</div>
        <div className="text-[#8A8F98] text-sm">{desc}</div>
      </div>
    </div>
  )
}

export default function CNCToken() {
  const { user } = useAuth()
  const cnc = useCNCToken()
  const [usd, setUsd] = useState('')
  const [showInvest, setShowInvest] = useState(false)

  const usdAmount = Number(usd) || 0
  const receiveQty = cnc.price > 0 && usdAmount > 0 ? usdAmount / cnc.price : 0
  const progressPct = useMemo(() => {
    const cap = Number(cnc.presale_cap) || 50000000
    const sold = Number(cnc.total_sold) || 0
    return Math.min(100, Math.max(0, (sold / cap) * 100))
  }, [cnc.presale_cap, cnc.total_sold])

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
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(0, 82, 255, 0.08))', border: `1px solid ${GOLD}40` }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img src={cncLogo} alt="CNC" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Coinova Coin</h1>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ background: GOLD, color: '#0A0B0D' }}>CNC</span>
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
                    {positive ? '+' : ''}{Number(cnc.change_24h || 0).toFixed(2)}%
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
          <StatCard label="Holders" value={formatNumber(cnc.holders_count, 0)} sub="users" />
        </div>

        {/* PRESALE CARD */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ background: '#141519', border: `2px solid ${GOLD}` }}>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white tracking-tight">Join the CNC Presale</h2>
            <PresaleLiveBadge />
          </div>
          <p className="text-[#8A8F98] mb-6">Buy before launch price doubles to ${Number(cnc.launch_price || 0.10).toFixed(2)}</p>

          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8A8F98] uppercase tracking-widest">Presale Progress</span>
              <span className="text-white font-semibold">
                {formatNumber(cnc.total_sold, 0)} / {formatNumber(cnc.presale_cap, 0)} CNC
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#1E2025' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: GOLD }} />
            </div>
            <div className="text-right text-xs text-[#8A8F98] mt-1">{progressPct.toFixed(2)}% sold</div>
          </div>

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

          <div className="rounded-lg px-4 py-3 mb-6 text-sm font-semibold text-center" style={{ background: 'rgba(5, 177, 105, 0.12)', color: GREEN }}>
            Early buyers get 100% profit at launch!
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
            {user ? 'Buy CNC Now' : 'Sign in to buy'}
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

        {/* TOKENOMICS */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Tokenomics</h2>
        <div className="rounded-xl p-6 mb-12" style={{ background: '#141519', border: '1px solid #1E2025' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={TOKENOMICS}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {TOKENOMICS.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0A0B0D', border: '1px solid #1E2025', color: '#FFF' }} formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {TOKENOMICS.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ background: item.color }} />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t" style={{ borderColor: '#1E2025' }}>
                <div className="text-[#8A8F98] text-xs uppercase tracking-widest mb-1">Total Supply</div>
                <div className="text-white font-bold text-lg">100,000,000 CNC</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROADMAP */}
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Roadmap</h2>
        <div className="rounded-xl p-6 sm:p-8 mb-12" style={{ background: '#141519', border: '1px solid #1E2025' }}>
          {ROADMAP.map((item, i) => (
            <RoadmapItem key={item.q} item={item} isLast={i === ROADMAP.length - 1} />
          ))}
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
