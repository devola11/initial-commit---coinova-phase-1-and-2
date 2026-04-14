import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ADMIN_EMAIL } from './Admin'
import { useKycStatus } from '../components/KYCBanner'
import { useTheme } from '../hooks/useTheme'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '\u20AC', label: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', label: 'British Pound' },
  { code: 'AED', symbol: '\u062F.\u0625', label: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'CHF', symbol: '\u20A3', label: 'Swiss Franc' },
  { code: 'JPY', symbol: '\u00A5', label: 'Japanese Yen' },
  { code: 'BTC', symbol: '\u20BF', label: 'Bitcoin' },
  { code: 'ETH', symbol: '\u039E', label: 'Ethereum' },
]

const WALLETS = [
  { label: 'BTC', address: 'bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl' },
  { label: 'ETH', address: '0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458' },
  { label: 'USDT TRC-20', address: 'TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca' },
]

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <button
      onClick={copy}
      className="px-2 py-1 rounded text-[11px] font-medium border border-[#1E2025] bg-transparent text-[#8A8F98] hover:text-white hover:border-[#2C2F36] cursor-pointer transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.06em] text-[#8A8F98] font-medium mb-3">
      {children}
    </div>
  )
}

function Row({ label, value, sub, right, onClick, noBorder }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-3.5 px-1 ${onClick ? 'cursor-pointer hover:bg-[#1a1d23] -mx-1 px-2 rounded-lg' : ''} ${noBorder ? '' : 'border-b border-[#1E2025]'}`}
    >
      <div className="min-w-0">
        <div className="text-white text-sm font-medium">{label}</div>
        {sub && <div className="text-[#8A8F98] text-xs mt-0.5">{sub}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && <span className="text-[#8A8F98] text-sm">{value}</span>}
        {right}
        {onClick && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8F98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        )}
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5 mb-5">
      {children}
    </div>
  )
}

function KYCCard() {
  const { kycStatus, rejectionReason } = useKycStatus()
  const statusConfig = {
    unverified: { label: 'Unverified', color: '#F59E0B', bg: '#F59E0B' },
    pending: { label: 'Under Review', color: '#0052FF', bg: '#0052FF' },
    approved: { label: 'Verified', color: '#05B169', bg: '#05B169' },
    rejected: { label: 'Rejected', color: '#F6465D', bg: '#F6465D' },
  }
  const cfg = statusConfig[kycStatus] || statusConfig.unverified

  return (
    <Card>
      <SectionTitle>KYC Verification</SectionTitle>
      <div className="flex items-center justify-between py-3.5 px-1">
        <div>
          <div className="text-white text-sm font-medium">Verification Status</div>
          {kycStatus === 'rejected' && rejectionReason && (
            <div className="text-[#F6465D] text-xs mt-0.5">Reason: {rejectionReason}</div>
          )}
          {kycStatus === 'pending' && (
            <div className="text-[#8A8F98] text-xs mt-0.5">Your documents are being reviewed</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-2.5 py-1 rounded text-[11px] font-semibold"
            style={{ background: `${cfg.bg}15`, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {(kycStatus === 'unverified' || !kycStatus) && (
            <Link
              to="/kyc"
              className="px-3 py-1.5 rounded-lg bg-[#0052FF] text-white text-xs font-semibold no-underline transition-colors hover:bg-[#0046D9]"
            >
              Complete verification
            </Link>
          )}
          {kycStatus === 'rejected' && (
            <Link
              to="/kyc"
              className="px-3 py-1.5 rounded-lg bg-[#F6465D] text-white text-xs font-semibold no-underline transition-opacity hover:opacity-90"
            >
              Resubmit
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [currency, setCurrency] = useState(() => localStorage.getItem('coinova_currency') || 'USD')
  const { theme, changeTheme } = useTheme()
  const [notifications, setNotifications] = useState(() => localStorage.getItem('coinova_notifications') !== 'off')
  const [saving, setSaving] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [show2faModal, setShow2faModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        if (data.currency) setCurrency(data.currency)
      }
    }
    load()
  }, [user])

  const walletId = user?.id ? user.id.slice(0, 8).toUpperCase() : '--------'
  const initials = (displayName || user?.email || '?').charAt(0).toUpperCase()
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '--'

  async function saveName() {
    setSaving(true)
    try {
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
    } catch {}
    setSaving(false)
    setEditingName(false)
  }

  function handleCurrencyChange(val) {
    setCurrency(val)
    localStorage.setItem('coinova_currency', val)
    supabase.from('profiles').update({ currency: val }).eq('id', user.id).then(() => {})
  }

  function handleThemeChange(val) {
    changeTheme(val)
  }

  function handleNotifToggle() {
    const next = !notifications
    setNotifications(next)
    localStorage.setItem('coinova_notifications', next ? 'on' : 'off')
  }

  async function handlePasswordChange() {
    setPwMsg('')
    if (pw.next.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    if (pw.next !== pw.confirm) { setPwMsg('Passwords do not match.'); return }
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      if (error) throw error
      setPwMsg('Password updated successfully.')
      setPw({ current: '', next: '', confirm: '' })
      setTimeout(() => { setShowPwForm(false); setPwMsg('') }, 2000)
    } catch (err) {
      setPwMsg(err.message || 'Failed to update password.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 tracking-tight">Settings</h1>

      {/* ── Profile card ──────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#0052FF] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0052FF]"
                  autoFocus
                />
                <button onClick={saveName} disabled={saving} className="px-3 py-2 rounded-lg bg-[#0052FF] text-white text-xs font-semibold border-none cursor-pointer">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)} className="px-3 py-2 rounded-lg border border-[#1E2025] bg-transparent text-[#8A8F98] text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="text-white font-semibold text-base">{displayName || 'Set display name'}</div>
                <div className="text-[#8A8F98] text-xs">{user?.email}</div>
                <div className="text-[#8A8F98] text-[11px] mt-0.5">Member since {memberSince}</div>
              </>
            )}
          </div>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="px-3 py-2 rounded-lg border border-[#1E2025] bg-transparent text-[#8A8F98] hover:text-white text-xs font-semibold cursor-pointer transition-colors flex-shrink-0"
            >
              Edit profile
            </button>
          )}
        </div>
      </Card>

      {/* ── General ───────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>General</SectionTitle>
        {/* Wallet ID */}
        <div className="flex items-center justify-between py-3.5 px-1 border-b border-[#1E2025]">
          <div>
            <div className="text-white text-sm font-medium">Wallet ID</div>
            <div className="text-[#F6465D] text-[11px] mt-0.5">Do not share publicly</div>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-[#8A8F98] text-sm font-mono">{walletId}</code>
            <CopyBtn text={walletId} />
          </div>
        </div>
        {/* Currency */}
        <div className="flex items-center justify-between py-3.5 px-1 border-b border-[#1E2025]">
          <div className="text-white text-sm font-medium">Local Currency</div>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#0052FF] cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        {/* Theme */}
        <div className="py-3.5 px-1 border-b border-[#1E2025]">
          <div className="text-white text-sm font-medium mb-3">Theme</div>
          <div className="grid grid-cols-3 gap-3">
            {/* Dark */}
            <button
              onClick={() => handleThemeChange('dark')}
              className={`bg-[#0A0B0D] rounded-xl p-4 text-center cursor-pointer transition-colors ${
                theme === 'dark' ? 'border-2 border-[#0052FF]' : 'border border-[#1E2025]'
              }`}
            >
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#0052FF' : '#8A8F98'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-[#0052FF]' : 'text-[#8A8F98]'}`}>Dark</div>
            </button>
            {/* Light */}
            <button
              onClick={() => handleThemeChange('light')}
              className={`bg-[#0A0B0D] rounded-xl p-4 text-center cursor-pointer transition-colors ${
                theme === 'light' ? 'border-2 border-[#0052FF]' : 'border border-[#1E2025]'
              }`}
            >
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme === 'light' ? '#0052FF' : '#8A8F98'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <div className={`text-xs font-semibold ${theme === 'light' ? 'text-[#0052FF]' : 'text-[#8A8F98]'}`}>Light</div>
            </button>
            {/* System */}
            <button
              onClick={() => handleThemeChange('system')}
              className={`bg-[#0A0B0D] rounded-xl p-4 text-center cursor-pointer transition-colors ${
                theme === 'system' ? 'border-2 border-[#0052FF]' : 'border border-[#1E2025]'
              }`}
            >
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme === 'system' ? '#0052FF' : '#8A8F98'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <div className={`text-xs font-semibold ${theme === 'system' ? 'text-[#0052FF]' : 'text-[#8A8F98]'}`}>System</div>
            </button>
          </div>
        </div>
        {/* Notifications */}
        <div className="flex items-center justify-between py-3.5 px-1">
          <div className="text-white text-sm font-medium">Notifications</div>
          <button
            onClick={handleNotifToggle}
            className={`w-11 h-6 rounded-full border-none cursor-pointer transition-colors relative ${
              notifications ? 'bg-[#0052FF]' : 'bg-[#2C2F36]'
            }`}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
              style={{ left: notifications ? '22px' : '2px' }}
            />
          </button>
        </div>
      </Card>

      {/* ── Security ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Security</SectionTitle>
        {/* Change password */}
        <div className="border-b border-[#1E2025]">
          <Row
            label="Change Password"
            onClick={() => setShowPwForm(!showPwForm)}
            noBorder
          />
          {showPwForm && (
            <div className="pb-4 px-1 space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#8A8F98] focus:outline-none focus:border-[#0052FF]"
              />
              <input
                type="password"
                placeholder="New password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#8A8F98] focus:outline-none focus:border-[#0052FF]"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#8A8F98] focus:outline-none focus:border-[#0052FF]"
              />
              {pwMsg && (
                <div className={`text-xs ${pwMsg.includes('success') ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>{pwMsg}</div>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className="px-5 py-2.5 rounded-lg bg-[#0052FF] text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
              >
                {pwSaving ? 'Saving...' : 'Update password'}
              </button>
            </div>
          )}
        </div>
        {/* 2FA */}
        <div className="flex items-center justify-between py-3.5 px-1 border-b border-[#1E2025]">
          <div>
            <div className="text-white text-sm font-medium">2-Step Verification</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F6465D]/10 text-[#F6465D]">Not enabled</span>
            <button
              onClick={() => setShow2faModal(true)}
              className="px-3 py-1.5 rounded-lg border border-[#1E2025] bg-transparent text-[#8A8F98] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
        {/* Active sessions */}
        <div className="py-3.5 px-1">
          <div className="text-white text-sm font-medium mb-2">Active Sessions</div>
          <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-3 text-xs text-[#8A8F98] mb-3">
            <div className="flex items-center justify-between">
              <span>Current browser session</span>
              <span className="text-[#05B169]">Active now</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg border border-[#1E2025] bg-transparent text-[#8A8F98] hover:text-[#F6465D] hover:border-[#F6465D]/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign out all devices
          </button>
        </div>
      </Card>

      {/* ── Trading Account ───────────────────────────────────────── */}
      <Card>
        <SectionTitle>Trading Account</SectionTitle>
        <Row label="Investment History" onClick={() => navigate('/portfolio')} />
        {/* Wallets */}
        <div className="py-3.5 px-1 border-b border-[#1E2025]">
          <div className="text-white text-sm font-medium mb-3">Your Wallets</div>
          <div className="space-y-2">
            {WALLETS.map((w) => (
              <div key={w.label} className="flex items-center justify-between bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-3">
                <div className="min-w-0">
                  <div className="text-[#8A8F98] text-[11px] font-medium mb-0.5">{w.label}</div>
                  <div className="text-white text-xs font-mono truncate">{w.address}</div>
                </div>
                <CopyBtn text={w.address} />
              </div>
            ))}
          </div>
        </div>
        <Row
          label="Limits & Features"
          noBorder
          right={
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#05B169]/10 text-[#05B169]">Verified</span>
          }
        />
      </Card>

      {/* ── KYC Verification ──────────────────────────────────────── */}
      <KYCCard />

      {/* ── Install App ─────────────────────────────────────────── */}
      <Card>
        <SectionTitle>Install Coinova App</SectionTitle>
        {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? (
          <div className="flex items-center gap-2 text-[#05B169] text-sm font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Coinova is installed on this device
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-3">
              <div className="text-white text-sm font-medium mb-1">Android (Chrome)</div>
              <div className="text-[#8A919E] text-xs">Tap the menu ({'\u22EE'}) {'\u2192'} Add to Home Screen {'\u2192'} Install</div>
            </div>
            <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-3">
              <div className="text-white text-sm font-medium mb-1">iPhone (Safari)</div>
              <div className="text-[#8A919E] text-xs">Tap Share ({'\u25A1\u2191'}) {'\u2192'} Add to Home Screen {'\u2192'} Add</div>
            </div>
            <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-3">
              <div className="text-white text-sm font-medium mb-1">Desktop (Chrome)</div>
              <div className="text-[#8A919E] text-xs">Click the install icon ({'\u2295'}) in the address bar</div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Admin ─────────────────────────────────────────────────── */}
      {user?.email?.toLowerCase() === ADMIN_EMAIL && (
        <div className="bg-[#0052FF]/10 border border-[#0052FF]/30 rounded-xl p-5 mb-5">
          <div className="text-[#0052FF] font-semibold mb-1">Administrator</div>
          <div className="text-[#8A8F98] text-sm mb-4">You have administrator access.</div>
          <Link
            to="/admin"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold no-underline transition-colors"
          >
            Open admin dashboard
          </Link>
        </div>
      )}

      {/* ── Danger zone ───────────────────────────────────────────── */}
      <div className="bg-[#141519] border border-[#F6465D]/30 rounded-xl p-5 mb-5">
        <SectionTitle>Danger Zone</SectionTitle>
        <div className="text-[#8A8F98] text-sm mb-4">
          Account: <span className="text-white">{user?.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-lg bg-[#F6465D] hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity"
          >
            Sign out
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-lg border border-[#2C2F36] bg-transparent text-[#8A8F98] hover:text-[#F6465D] hover:border-[#F6465D]/30 text-sm font-semibold cursor-pointer transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* ── 2FA Modal ─────────────────────────────────────────────── */}
      {show2faModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShow2faModal(false)}>
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-white font-semibold mb-3">2-Step Verification</div>
            <p className="text-[#8A8F98] text-sm mb-5 leading-relaxed">
              Two-factor authentication adds an extra layer of security to your account. This feature will be available in a future update.
            </p>
            <button
              onClick={() => setShow2faModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#0052FF] text-white text-sm font-semibold border-none cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ──────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-[#F6465D] font-semibold mb-3">Delete Account</div>
            <p className="text-[#8A8F98] text-sm mb-2 leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone. All your data, holdings, and transaction history will be permanently removed.
            </p>
            <p className="text-white text-sm mb-5">{user?.email}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#1E2025] bg-transparent text-white text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteModal(false)
                  await logout()
                  navigate('/')
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#F6465D] text-white text-sm font-semibold border-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
