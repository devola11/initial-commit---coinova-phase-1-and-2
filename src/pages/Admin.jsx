import { useEffect, useState, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatUSD, formatNumber } from '../utils/formatters'
import { useCNCToken } from '../hooks/useCNCToken'
import { sendSecurityEmail } from '../utils/notifications'

export const ADMIN_EMAIL = 'frontenddev177@gmail.com'

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']
const ADMIN_TABS = ['INVESTMENTS', 'KYC', 'CNC', 'SUPPORT', 'WITHDRAWALS']
const SUPPORT_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const WITHDRAWAL_TABS = ['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED']
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY

const WITHDRAWAL_STATUS_STYLES = {
  pending:      { bg: '#F59E0B20', fg: '#F59E0B', label: 'Pending' },
  under_review: { bg: '#0052FF20', fg: '#0052FF', label: 'Under Review' },
  approved:     { bg: '#7C3AED20', fg: '#7C3AED', label: 'Approved' },
  completed:    { bg: '#05B16920', fg: '#05B169', label: 'Completed' },
  rejected:     { bg: '#F6465D20', fg: '#F6465D', label: 'Rejected' },
}

const TICKET_STATUS_STYLES = {
  open:        { bg: '#F59E0B20', fg: '#F59E0B', label: 'Open' },
  in_progress: { bg: '#0052FF20', fg: '#0052FF', label: 'In Progress' },
  resolved:    { bg: '#05B16920', fg: '#05B169', label: 'Resolved' },
  closed:      { bg: '#8A919E20', fg: '#8A919E', label: 'Closed' },
}

const TICKET_PRIORITY_STYLES = {
  low:    { bg: '#8A919E20', fg: '#8A919E', label: 'Low' },
  high:   { bg: '#F59E0B20', fg: '#F59E0B', label: 'High' },
  urgent: { bg: '#F6465D20', fg: '#F6465D', label: 'Urgent' },
}

const STATUS_STYLES = {
  pending:  'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-profit/15 text-profit',
  rejected: 'bg-loss/15 text-loss',
}

function explorerUrl(walletUsed, hash) {
  if (!hash) return null
  if (walletUsed === 'btc') return `https://blockstream.info/tx/${hash}`
  if (walletUsed === 'eth') return `https://etherscan.io/tx/${hash}`
  if (walletUsed === 'usdt_trc20') return `https://tronscan.org/#/transaction/${hash}`
  return null
}

function truncate(hash) {
  if (!hash) return '-'
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

function RejectModal({ onClose, onConfirm, submitting }) {
  const [note, setNote] = useState('')
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-text-primary font-semibold mb-3">
          Reject investment request
        </div>
        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Rejection reason
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why is this being rejected?"
          rows={4}
          className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={submitting || !note.trim()}
            className="flex-1 py-2.5 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer transition-opacity"
          >
            {submitting ? 'Rejecting...' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneClass =
    tone === 'yellow' ? 'text-yellow-400'
    : tone === 'green' ? 'text-profit'
    : tone === 'red' ? 'text-loss'
    : 'text-text-primary'
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="text-text-muted text-[10px] uppercase tracking-widest mb-2 font-medium">
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ALL')
  const [actioning, setActioning] = useState(null)
  const [toast, setToast] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [adminTab, setAdminTab] = useState('INVESTMENTS')
  const [kycRows, setKycRows] = useState([])
  const [kycLoading, setKycLoading] = useState(true)
  const [kycTab, setKycTab] = useState('ALL')
  const [kycReviewing, setKycReviewing] = useState(null)
  const [kycActioning, setKycActioning] = useState(null)
  const [kycRejectReason, setKycRejectReason] = useState('')
  const [showKycReject, setShowKycReject] = useState(false)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketTab, setTicketTab] = useState('ALL')
  const [reviewingTicket, setReviewingTicket] = useState(null)
  const [ticketSaving, setTicketSaving] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true)
  const [withdrawalTab, setWithdrawalTab] = useState('ALL')
  const [reviewingWithdrawal, setReviewingWithdrawal] = useState(null)
  const [withdrawalSaving, setWithdrawalSaving] = useState(false)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const fetchRows = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('investment_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setRows(data || [])
    setLoading(false)
  }, [])

  const fetchKyc = useCallback(async () => {
    setKycLoading(true)
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (error) console.error(error)
    setKycRows(data || [])
    setKycLoading(false)
  }, [])

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true)
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setTickets(data || [])
    setTicketsLoading(false)
  }, [])

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true)
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setWithdrawals(data || [])
    setWithdrawalsLoading(false)
  }, [])

  useEffect(() => {
    if (isAdmin) { fetchRows(); fetchKyc(); fetchTickets(); fetchWithdrawals() }
  }, [isAdmin, fetchRows, fetchKyc, fetchTickets, fetchWithdrawals])

  const ticketStats = useMemo(() => {
    const by = { open: 0, in_progress: 0, resolved: 0, closed: 0 }
    for (const t of tickets) {
      const s = (t.status || 'open').toLowerCase()
      if (by[s] != null) by[s] += 1
    }
    return { total: tickets.length, ...by }
  }, [tickets])

  const visibleTickets = useMemo(() => {
    if (ticketTab === 'ALL') return tickets
    const target = ticketTab.toLowerCase()
    return tickets.filter((t) => (t.status || 'open').toLowerCase() === target)
  }, [tickets, ticketTab])

  const kycStats = useMemo(() => {
    const by = { pending: 0, approved: 0, rejected: 0 }
    for (const r of kycRows) {
      const s = (r.status || 'pending').toLowerCase()
      if (by[s] != null) by[s] += 1
    }
    return { total: kycRows.length, ...by }
  }, [kycRows])

  const visibleKycRows = useMemo(() => {
    if (kycTab === 'ALL') return kycRows
    return kycRows.filter((r) => (r.status || 'pending').toLowerCase() === kycTab.toLowerCase())
  }, [kycRows, kycTab])

  const withdrawalStats = useMemo(() => {
    const by = { pending: 0, under_review: 0, approved: 0, completed: 0, rejected: 0 }
    let totalUsd = 0
    for (const w of withdrawals) {
      const s = (w.status || 'pending').toLowerCase()
      if (by[s] != null) by[s] += 1
      totalUsd += Number(w.amount_usd) || 0
    }
    return { total: withdrawals.length, ...by, totalUsd }
  }, [withdrawals])

  const visibleWithdrawals = useMemo(() => {
    if (withdrawalTab === 'ALL') return withdrawals
    const target = withdrawalTab.toLowerCase()
    return withdrawals.filter((w) => (w.status || 'pending').toLowerCase() === target)
  }, [withdrawals, withdrawalTab])

  async function approveKyc(row) {
    if (kycActioning) return
    setKycActioning(row.id)
    try {
      await supabase.from('kyc_submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', row.id)
      await supabase.from('profiles').update({ kyc_status: 'approved' }).eq('id', row.user_id)
      showToast('KYC Approved!')
      setKycReviewing(null)
      await fetchKyc()
    } catch (err) {
      showToast('Approve failed: ' + err.message)
    } finally {
      setKycActioning(null)
    }
  }

  async function rejectKyc(row) {
    if (kycActioning || !kycRejectReason.trim()) return
    setKycActioning(row.id)
    try {
      await supabase.from('kyc_submissions').update({ status: 'rejected', rejection_reason: kycRejectReason, reviewed_at: new Date().toISOString() }).eq('id', row.id)
      await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', row.user_id)
      showToast('KYC Rejected')
      setKycReviewing(null)
      setShowKycReject(false)
      setKycRejectReason('')
      await fetchKyc()
    } catch (err) {
      showToast('Reject failed: ' + err.message)
    } finally {
      setKycActioning(null)
    }
  }

  const stats = useMemo(() => {
    const by = { pending: 0, approved: 0, rejected: 0 }
    let totalUsd = 0
    for (const r of rows) {
      const s = (r.status || 'pending').toLowerCase()
      if (by[s] != null) by[s] += 1
      totalUsd += Number(r.amount_usd) || 0
    }
    return { total: rows.length, ...by, totalUsd }
  }, [rows])

  const visibleRows = useMemo(() => {
    if (tab === 'ALL') return rows
    const target = tab.toLowerCase()
    return rows.filter((r) => (r.status || 'pending').toLowerCase() === target)
  }, [rows, tab])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Credit user's Main Wallet (cash top-up). Approved investments now add USD
  // to wallet_balance - the user then buys coins from BuyModal in wallet mode.
  // No direct holding creation, keeping demo and real ledgers cleanly separate.
  async function approveRequest(row) {
    if (actioning) return
    setActioning(row.id)
    try {
      const amount = Number(row.amount_usd) || 0
      if (amount <= 0) {
        throw new Error('Request has no amount to credit')
      }

      const { data: walletRow, error: fetchErr } = await supabase
        .from('wallet')
        .select('wallet_balance')
        .eq('user_id', row.user_id)
        .maybeSingle()
      if (fetchErr) throw fetchErr

      const currentBalance = Number(walletRow?.wallet_balance || 0)
      const newBalance = currentBalance + amount

      const { error: walletErr } = await supabase
        .from('wallet')
        .update({ wallet_balance: newBalance })
        .eq('user_id', row.user_id)
      if (walletErr) throw walletErr

      const { error: statusErr } = await supabase
        .from('investment_requests')
        .update({ status: 'approved' })
        .eq('id', row.id)
      if (statusErr) throw statusErr

      showToast('Main Wallet credited with real funds!')
      await fetchRows()
    } catch (err) {
      console.error(err)
      showToast(`Approve failed: ${err.message}`)
    } finally {
      setActioning(null)
    }
  }

  async function saveTicketResponse(ticket, { adminResponse, newStatus, newPriority }) {
    if (ticketSaving) return
    setTicketSaving(true)
    try {
      const update = {
        admin_response: adminResponse,
        status: newStatus,
        priority: newPriority,
      }
      if ((newStatus === 'resolved' || newStatus === 'closed') && !ticket.resolved_at) {
        update.resolved_at = new Date().toISOString()
      }

      const { error: updateErr } = await supabase
        .from('support_tickets')
        .update(update)
        .eq('id', ticket.id)
      if (updateErr) throw updateErr

      if (adminResponse?.trim() && ticket.user_email) {
        try {
          await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject: `Coinova Support: Response to ${ticket.ticket_number}`,
              from_name: 'Coinova Support',
              email: ticket.user_email,
              message: `Hi ${ticket.user_name},

Your ticket: ${ticket.ticket_number}
Subject: ${ticket.subject}
Status: ${newStatus}

Our response:
${adminResponse}

Reply to this email if you need more help.

Coinova Support Team`,
              replyto: 'coinovasupport@gmail.com',
            }),
          })
        } catch (mailErr) {
          console.warn('Email send failed:', mailErr)
        }
      }

      showToast('Ticket updated and customer notified')
      setReviewingTicket(null)
      await fetchTickets()
    } catch (err) {
      console.error(err)
      showToast(`Update failed: ${err.message}`)
    } finally {
      setTicketSaving(false)
    }
  }

  async function saveWithdrawal(row, { newStatus, adminNotes, txHash }) {
    if (withdrawalSaving) return
    setWithdrawalSaving(true)
    try {
      const update = {
        status: newStatus,
        admin_notes: adminNotes,
        tx_hash: txHash || null,
      }
      if (newStatus === 'completed' && !row.completed_at) {
        update.completed_at = new Date().toISOString()
      }

      const { error: updateErr } = await supabase
        .from('withdrawal_requests')
        .update(update)
        .eq('id', row.id)
      if (updateErr) throw updateErr

      const wasNotFinalised =
        row.status !== 'completed' && row.status !== 'rejected'

      if (newStatus === 'rejected' && wasNotFinalised) {
        const refundAmount = Number(row.amount) || 0
        if (row.withdrawal_type === 'crypto') {
          const { data: w } = await supabase
            .from('wallet')
            .select('wallet_balance')
            .eq('user_id', row.user_id)
            .maybeSingle()
          const current = Number(w?.wallet_balance || 0)
          await supabase
            .from('wallet')
            .update({ wallet_balance: current + refundAmount })
            .eq('user_id', row.user_id)
        } else {
          const { data: h } = await supabase
            .from('cnc_holdings')
            .select('quantity')
            .eq('user_id', row.user_id)
            .maybeSingle()
          const current = Number(h?.quantity || 0)
          await supabase
            .from('cnc_holdings')
            .update({ quantity: current + refundAmount })
            .eq('user_id', row.user_id)
        }
      }

      if (row.user_email) {
        const destShort =
          row.destination_address
            ? row.destination_address.substring(0, 8) +
              '...' +
              row.destination_address.slice(-6)
            : '-'
        if (newStatus === 'completed') {
          await sendSecurityEmail({
            userEmail: row.user_email,
            userName: row.user_name,
            type: 'withdrawal_completed',
            details: {
              requestNumber: row.request_number,
              amount: row.amount,
              symbol: row.coin_symbol,
              destination: destShort,
              txHash,
            },
          })
        } else if (newStatus === 'rejected') {
          await sendSecurityEmail({
            userEmail: row.user_email,
            userName: row.user_name,
            type: 'withdrawal_rejected',
            details: {
              requestNumber: row.request_number,
              amount: row.amount,
              symbol: row.coin_symbol,
              reason: adminNotes,
            },
          })
        }
      }

      showToast('Withdrawal updated')
      setReviewingWithdrawal(null)
      await fetchWithdrawals()
    } catch (err) {
      console.error(err)
      showToast(`Update failed: ${err.message}`)
    } finally {
      setWithdrawalSaving(false)
    }
  }

  async function confirmReject(note) {
    if (!rejecting) return
    setRejectSubmitting(true)
    try {
      const { error } = await supabase
        .from('investment_requests')
        .update({ status: 'rejected', admin_note: note })
        .eq('id', rejecting.id)
      if (error) throw error
      showToast('Request rejected')
      setRejecting(null)
      await fetchRows()
    } catch (err) {
      console.error(err)
      showToast(`Reject failed: ${err.message}`)
    } finally {
      setRejectSubmitting(false)
    }
  }

  if (user === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-text-muted text-sm">
        Checking admin access...
      </div>
    )
  }
  if (user && !isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Admin Dashboard
        </h1>
      </div>

      {/* Admin tab switcher */}
      <div className="flex items-center gap-2 mb-6 border-b border-card-border">
        {ADMIN_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setAdminTab(t)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer bg-transparent ${
              adminTab === t
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {adminTab === 'INVESTMENTS' && (
      <>
      <p className="text-text-muted text-sm mb-4">
        Approve or reject pending investment requests.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total requests" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} tone="yellow" />
        <StatCard label="Approved" value={stats.approved} tone="green" />
        <StatCard label="Rejected" value={stats.rejected} tone="red" />
        <StatCard label="Total USD invested" value={formatUSD(stats.totalUsd)} />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        {STATUS_TABS.map((t) => {
          const active = t === tab
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                active
                  ? 'bg-primary-blue border-primary-blue text-white'
                  : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Coin</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Wallet</th>
                <th className="py-3 px-4 font-medium">TX Hash</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-text-muted">
                    Loading...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-text-muted">
                    No requests in this bucket.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const status = (r.status || 'pending').toLowerCase()
                  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
                  const txUrl = explorerUrl(r.wallet_used, r.tx_hash)
                  const isPending = status === 'pending'
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                    >
                      <td className="py-4 px-4 text-text-primary text-xs break-all max-w-[200px]">
                        {r.user_email || r.user_id?.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-text-primary font-semibold">
                          {r.coin_name}
                        </div>
                        <div className="text-text-muted text-xs uppercase">
                          {r.coin_symbol}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-text-primary font-semibold">
                        {formatUSD(r.amount_usd)}
                      </td>
                      <td className="py-4 px-4 text-text-muted uppercase text-xs">
                        {r.wallet_used}
                      </td>
                      <td className="py-4 px-4">
                        {txUrl ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-blue hover:underline font-mono text-xs"
                          >
                            {truncate(r.tx_hash)}
                          </a>
                        ) : (
                          <span className="text-text-muted font-mono text-xs">
                            {truncate(r.tx_hash)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-text-muted text-xs">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${style}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {isPending ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => approveRequest(r)}
                              disabled={actioning === r.id}
                              className="px-3 py-1.5 rounded-lg bg-profit hover:opacity-90 text-white text-xs font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50"
                            >
                              {actioning === r.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setRejecting(r)}
                              disabled={actioning === r.id}
                              className="px-3 py-1.5 rounded-lg bg-loss hover:opacity-90 text-white text-xs font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-text-muted text-xs italic">
                            {r.admin_note || '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>
      )}

      {adminTab === 'KYC' && (
      <>
        <p className="text-text-muted text-sm mb-4">Review and manage KYC verification submissions.</p>

        {/* KYC Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total KYC submitted" value={kycStats.total} />
          <StatCard label="Pending review" value={kycStats.pending} tone="yellow" />
          <StatCard label="Approved" value={kycStats.approved} tone="green" />
          <StatCard label="Rejected" value={kycStats.rejected} tone="red" />
        </div>

        {/* KYC Filter tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setKycTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                t === kycTab
                  ? 'bg-primary-blue border-primary-blue text-white'
                  : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* KYC Table */}
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Full Name</th>
                  <th className="py-3 px-4 font-medium">Country</th>
                  <th className="py-3 px-4 font-medium">Doc Type</th>
                  <th className="py-3 px-4 font-medium">Submitted</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycLoading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-text-muted">Loading...</td></tr>
                ) : visibleKycRows.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-text-muted">No KYC submissions in this bucket.</td></tr>
                ) : (
                  visibleKycRows.map((r) => {
                    const status = (r.status || 'pending').toLowerCase()
                    const style = STATUS_STYLES[status] || STATUS_STYLES.pending
                    return (
                      <tr key={r.id} className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors">
                        <td className="py-4 px-4 text-text-primary text-xs break-all max-w-[180px]">{r.user_id?.slice(0, 8)}</td>
                        <td className="py-4 px-4 text-text-primary font-semibold">{r.full_name}</td>
                        <td className="py-4 px-4 text-text-muted text-xs">{r.country}</td>
                        <td className="py-4 px-4 text-text-muted text-xs capitalize">{(r.document_type || '').replace('_', ' ')}</td>
                        <td className="py-4 px-4 text-text-muted text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${style}`}>{status}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setKycReviewing(r)}
                            className="px-3 py-1.5 rounded-lg bg-primary-blue hover:opacity-90 text-white text-xs font-semibold border-none cursor-pointer transition-opacity"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

      {/* KYC Review Modal */}
      {kycReviewing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setKycReviewing(null); setShowKycReject(false); setKycRejectReason('') }}>
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-text-primary font-semibold text-lg">KYC Review</div>
              <button onClick={() => { setKycReviewing(null); setShowKycReject(false); setKycRejectReason('') }} className="text-text-muted hover:text-white bg-transparent border-none cursor-pointer text-xl">&times;</button>
            </div>

            {/* User details */}
            <div className="bg-root-bg border border-card-border rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Name</span><span className="text-text-primary font-semibold">{kycReviewing.full_name}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Date of Birth</span><span className="text-text-primary">{kycReviewing.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Country</span><span className="text-text-primary">{kycReviewing.country}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Phone</span><span className="text-text-primary">{kycReviewing.phone}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Address</span><span className="text-text-primary text-right max-w-[60%]">{kycReviewing.address}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Document Type</span><span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-primary-blue/15 text-primary-blue">{(kycReviewing.document_type || '').replace('_', ' ')}</span></div>
            </div>

            {/* Document images */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {kycReviewing.front_image_url && (
                <div>
                  <div className="text-text-muted text-xs mb-1">Front of document</div>
                  <a href={kycReviewing.front_image_url} target="_blank" rel="noreferrer">
                    <img src={kycReviewing.front_image_url} alt="Front" className="w-full h-40 object-cover rounded-lg bg-root-bg border border-card-border cursor-pointer hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
              {kycReviewing.back_image_url && (
                <div>
                  <div className="text-text-muted text-xs mb-1">Back of document</div>
                  <a href={kycReviewing.back_image_url} target="_blank" rel="noreferrer">
                    <img src={kycReviewing.back_image_url} alt="Back" className="w-full h-40 object-cover rounded-lg bg-root-bg border border-card-border cursor-pointer hover:opacity-80 transition-opacity" />
                  </a>
                </div>
              )}
            </div>
            {kycReviewing.selfie_url && (
              <div className="mb-4">
                <div className="text-text-muted text-xs mb-1">Selfie with ID</div>
                <a href={kycReviewing.selfie_url} target="_blank" rel="noreferrer">
                  <img src={kycReviewing.selfie_url} alt="Selfie" className="w-48 h-40 object-cover rounded-lg bg-root-bg border border-card-border cursor-pointer hover:opacity-80 transition-opacity" />
                </a>
              </div>
            )}

            {/* Reject reason input */}
            {showKycReject && (
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">Rejection Reason (required)</label>
                <textarea
                  value={kycRejectReason}
                  onChange={(e) => setKycRejectReason(e.target.value)}
                  placeholder="Why is this KYC being rejected?"
                  rows={3}
                  className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
                />
              </div>
            )}

            {/* Action buttons */}
            {(kycReviewing.status || 'pending').toLowerCase() === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => approveKyc(kycReviewing)}
                  disabled={!!kycActioning}
                  className="flex-1 py-2.5 rounded-lg bg-profit hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50"
                >
                  {kycActioning === kycReviewing.id ? 'Approving...' : 'Approve'}
                </button>
                {!showKycReject ? (
                  <button
                    onClick={() => setShowKycReject(true)}
                    className="flex-1 py-2.5 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity"
                  >
                    Reject
                  </button>
                ) : (
                  <button
                    onClick={() => rejectKyc(kycReviewing)}
                    disabled={!!kycActioning || !kycRejectReason.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50"
                  >
                    {kycActioning === kycReviewing.id ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                )}
              </div>
            )}
            {(kycReviewing.status || 'pending').toLowerCase() !== 'pending' && (
              <div className="text-text-muted text-sm italic text-center py-2">
                This submission has already been {kycReviewing.status}.
                {kycReviewing.rejection_reason && <span className="block mt-1">Reason: {kycReviewing.rejection_reason}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'CNC' && (
        <CNCAdminPanel showToast={showToast} />
      )}

      {adminTab === 'SUPPORT' && (
        <>
          <p className="text-text-muted text-sm mb-4">
            Respond to customer support tickets. Saving a response sends an email to the customer.
          </p>

          {/* Support stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total tickets" value={ticketStats.total} />
            <StatCard label="Open" value={ticketStats.open} tone="yellow" />
            <StatCard label="In progress" value={ticketStats.in_progress} />
            <StatCard label="Resolved" value={ticketStats.resolved} tone="green" />
          </div>

          {/* Support filter tabs */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto">
            {SUPPORT_TABS.map((t) => {
              const active = t === ticketTab
              return (
                <button
                  key={t}
                  onClick={() => setTicketTab(t)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary-blue border-primary-blue text-white'
                      : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              )
            })}
          </div>

          {/* Support table */}
          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                    <th className="py-3 px-4 font-medium">Ticket</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Priority</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsLoading ? (
                    <tr><td colSpan={7} className="py-10 text-center text-text-muted">Loading...</td></tr>
                  ) : visibleTickets.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-text-muted">No tickets in this bucket.</td></tr>
                  ) : (
                    visibleTickets.map((t) => {
                      const status = (t.status || 'open').toLowerCase()
                      const sStyle = TICKET_STATUS_STYLES[status] || TICKET_STATUS_STYLES.open
                      const pStyle = TICKET_PRIORITY_STYLES[(t.priority || '').toLowerCase()]
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setReviewingTicket(t)}
                          className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-4 text-primary-blue font-mono text-xs">{t.ticket_number}</td>
                          <td className="py-4 px-4">
                            <div className="text-text-primary text-sm">{t.user_name || '-'}</div>
                            <div className="text-text-muted text-xs">{t.user_email}</div>
                          </td>
                          <td className="py-4 px-4 text-text-primary text-sm max-w-[260px] truncate">{t.subject}</td>
                          <td className="py-4 px-4 text-text-muted text-xs">{t.category}</td>
                          <td className="py-4 px-4">
                            {pStyle ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                                style={{ background: pStyle.bg, color: pStyle.fg }}
                              >
                                {pStyle.label}
                              </span>
                            ) : (
                              <span className="text-text-muted text-xs">Normal</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: sStyle.bg, color: sStyle.fg }}
                            >
                              {sStyle.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-text-muted text-xs">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {adminTab === 'WITHDRAWALS' && (
        <>
          <p className="text-text-muted text-sm mb-4">
            Process customer withdrawal requests. Marking complete sends a confirmation email; rejecting refunds the balance.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total" value={withdrawalStats.total} />
            <StatCard label="Pending" value={withdrawalStats.pending} tone="yellow" />
            <StatCard label="Approved" value={withdrawalStats.approved} />
            <StatCard label="Completed" value={withdrawalStats.completed} tone="green" />
            <StatCard label="Rejected" value={withdrawalStats.rejected} tone="red" />
          </div>

          <div className="flex items-center gap-2 mb-5 overflow-x-auto">
            {WITHDRAWAL_TABS.map((t) => {
              const active = t === withdrawalTab
              const label = t.replace('_', ' ')
              return (
                <button
                  key={t}
                  onClick={() => setWithdrawalTab(t)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary-blue border-primary-blue text-white'
                      : 'bg-transparent border-card-border text-text-muted hover:text-text-primary hover:border-primary-blue/50'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                    <th className="py-3 px-4 font-medium">Request #</th>
                    <th className="py-3 px-4 font-medium">User</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Coin</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Destination</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading ? (
                    <tr><td colSpan={8} className="py-10 text-center text-text-muted">Loading...</td></tr>
                  ) : visibleWithdrawals.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-text-muted">No withdrawals in this bucket.</td></tr>
                  ) : (
                    visibleWithdrawals.map((w) => {
                      const status = (w.status || 'pending').toLowerCase()
                      const sStyle = WITHDRAWAL_STATUS_STYLES[status] || WITHDRAWAL_STATUS_STYLES.pending
                      return (
                        <tr
                          key={w.id}
                          onClick={() => setReviewingWithdrawal(w)}
                          className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-4 text-primary-blue font-mono text-xs">{w.request_number}</td>
                          <td className="py-4 px-4 text-text-primary text-xs break-all max-w-[200px]">{w.user_email}</td>
                          <td className="py-4 px-4 text-text-muted text-xs uppercase">{w.withdrawal_type}</td>
                          <td className="py-4 px-4 text-text-primary font-semibold">{w.coin_symbol}</td>
                          <td className="py-4 px-4 text-text-primary font-semibold">
                            {Number(w.amount).toLocaleString()} {w.coin_symbol}
                            <div className="text-text-muted text-xs font-normal">{formatUSD(w.amount_usd)}</div>
                          </td>
                          <td className="py-4 px-4 text-text-muted font-mono text-xs">{truncate(w.destination_address)}</td>
                          <td className="py-4 px-4">
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: sStyle.bg, color: sStyle.fg }}
                            >
                              {sStyle.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-text-muted text-xs">
                            {w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reviewingTicket && (
        <TicketDetailModal
          ticket={reviewingTicket}
          onClose={() => setReviewingTicket(null)}
          onSave={saveTicketResponse}
          saving={ticketSaving}
        />
      )}

      {reviewingWithdrawal && (
        <WithdrawalDetailModal
          withdrawal={reviewingWithdrawal}
          onClose={() => setReviewingWithdrawal(null)}
          onSave={saveWithdrawal}
          saving={withdrawalSaving}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-card-bg border border-card-border rounded-lg px-5 py-3 text-sm text-text-primary shadow-xl">
          {toast}
        </div>
      )}

      {rejecting && (
        <RejectModal
          onClose={() => setRejecting(null)}
          onConfirm={confirmReject}
          submitting={rejectSubmitting}
        />
      )}
    </div>
  )
}

function CNCAdminPanel({ showToast }) {
  const cnc = useCNCToken()
  const [newPrice, setNewPrice] = useState('')
  const [newChange, setNewChange] = useState('')
  const [saving, setSaving] = useState(false)
  const [holders, setHolders] = useState([])
  const [loadingHolders, setLoadingHolders] = useState(true)

  const fetchHolders = useCallback(async () => {
    setLoadingHolders(true)
    try {
      const { data, error } = await supabase
        .from('cnc_holdings')
        .select('*')
        .order('quantity', { ascending: false })
        .limit(100)
      if (error) throw error
      setHolders(data || [])
    } catch (err) {
      console.warn('fetchHolders failed', err?.message || err)
      setHolders([])
    } finally {
      setLoadingHolders(false)
    }
  }, [])

  useEffect(() => {
    fetchHolders()
  }, [fetchHolders])

  async function handleUpdate() {
    if (saving) return
    const price = Number(newPrice)
    const change = Number(newChange)
    if (!price || price <= 0) {
      showToast('Enter a valid price.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        price,
        change_24h: Number.isFinite(change) ? change : 0,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('cnc_token')
        .upsert({ id: 1, ...payload }, { onConflict: 'id' })
      if (error) throw error
      showToast('CNC price updated!')
      setNewPrice('')
      setNewChange('')
      cnc.refresh()
    } catch (err) {
      showToast(`Update failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <p className="text-text-muted text-sm mb-4">Manage the CNC token price, presale data, and holders.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Price" value={formatUSD(cnc.price)} />
        <StatCard label="24h Change" value={`${(Number(cnc.change_24h) || 0) >= 0 ? '+' : ''}${Number(cnc.change_24h || 0).toFixed(2)}%`} tone={(Number(cnc.change_24h) || 0) >= 0 ? 'green' : 'red'} />
        <StatCard label="Total Sold" value={`${formatNumber(cnc.total_sold, 0)} CNC`} />
        <StatCard label="USDT Received" value={formatUSD(cnc.total_usdt_received)} />
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-5 mb-6">
        <div className="text-text-primary font-semibold mb-4">Update CNC Price</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">New Price (USD)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={String(cnc.price)}
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">24h Change (%)</label>
            <input
              type="number"
              step="0.01"
              value={newChange}
              onChange={(e) => setNewChange(e.target.value)}
              placeholder={String(cnc.change_24h)}
              className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleUpdate}
              disabled={saving || !newPrice}
              className="w-full py-3 rounded-lg text-white text-sm font-semibold border-none cursor-pointer transition-colors disabled:opacity-50"
              style={{ background: '#FFD700', color: '#0A0B0D' }}
            >
              {saving ? 'Updating...' : 'Update CNC'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-text-primary font-semibold">Holders</div>
          <div className="text-text-muted text-xs">{holders.length} total</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                <th className="py-3 px-4 font-medium">User ID</th>
                <th className="py-3 px-4 font-medium">Quantity (CNC)</th>
                <th className="py-3 px-4 font-medium">Avg Buy Price</th>
                <th className="py-3 px-4 font-medium">USD Value</th>
              </tr>
            </thead>
            <tbody>
              {loadingHolders ? (
                <tr><td colSpan={4} className="py-10 text-center text-text-muted">Loading...</td></tr>
              ) : holders.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-text-muted">No holders yet.</td></tr>
              ) : holders.map((h) => (
                <tr key={h.user_id} className="border-b border-card-border last:border-b-0">
                  <td className="py-3 px-4 text-text-primary text-xs font-mono break-all max-w-[260px]">{h.user_id}</td>
                  <td className="py-3 px-4 text-text-primary font-semibold">{formatNumber(h.quantity, 2)}</td>
                  <td className="py-3 px-4 text-text-muted">{formatUSD(Number(h.avg_buy_price) || 0)}</td>
                  <td className="py-3 px-4 text-text-primary">{formatUSD((Number(h.quantity) || 0) * cnc.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function TicketDetailModal({ ticket, onClose, onSave, saving }) {
  const [adminResponse, setAdminResponse] = useState(ticket.admin_response || '')
  const [newStatus, setNewStatus] = useState((ticket.status || 'open').toLowerCase())
  const [newPriority, setNewPriority] = useState((ticket.priority || 'normal').toLowerCase())

  const sStyle = TICKET_STATUS_STYLES[(ticket.status || 'open').toLowerCase()] || TICKET_STATUS_STYLES.open

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-primary-blue font-mono text-xs">{ticket.ticket_number}</span>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: sStyle.bg, color: sStyle.fg }}
              >
                {sStyle.label}
              </span>
            </div>
            <div className="text-text-primary font-semibold text-lg break-words">{ticket.subject}</div>
            <div className="text-text-muted text-xs mt-1">
              {ticket.user_name} · {ticket.user_email} · {ticket.category}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white bg-transparent border-none cursor-pointer text-xl flex-shrink-0"
          >
            &times;
          </button>
        </div>

        <div className="bg-root-bg border border-card-border rounded-lg p-4 mb-5">
          <div className="text-text-muted text-[10px] uppercase tracking-widest mb-1.5 font-medium">
            Customer message
          </div>
          <div className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
            {ticket.message}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-root-bg border border-card-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
              Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full bg-root-bg border border-card-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
            Your response
          </label>
          <textarea
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="Write a reply to the customer. Saving sends them an email."
            rows={6}
            className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
          />
          <div className="text-text-muted text-xs mt-1.5">
            Tip: leaving this blank just updates status/priority - no email is sent.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(ticket, { adminResponse, newStatus, newPriority })}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary-blue hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save & notify customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WithdrawalDetailModal({ withdrawal, onClose, onSave, saving }) {
  const [newStatus, setNewStatus] = useState((withdrawal.status || 'pending').toLowerCase())
  const [adminNotes, setAdminNotes] = useState(withdrawal.admin_notes || '')
  const [txHash, setTxHash] = useState(withdrawal.tx_hash || '')

  const sStyle =
    WITHDRAWAL_STATUS_STYLES[(withdrawal.status || 'pending').toLowerCase()] ||
    WITHDRAWAL_STATUS_STYLES.pending
  const isFinalised =
    withdrawal.status === 'completed' || withdrawal.status === 'rejected'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-primary-blue font-mono text-xs">{withdrawal.request_number}</span>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: sStyle.bg, color: sStyle.fg }}
              >
                {sStyle.label}
              </span>
            </div>
            <div className="text-text-primary font-semibold text-lg break-words">
              {Number(withdrawal.amount).toLocaleString()} {withdrawal.coin_symbol}
            </div>
            <div className="text-text-muted text-xs mt-1">
              {withdrawal.user_name || 'User'} - {withdrawal.user_email}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white bg-transparent border-none cursor-pointer text-xl flex-shrink-0"
          >
            &times;
          </button>
        </div>

        <div className="bg-root-bg border border-card-border rounded-lg p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="text-text-primary uppercase">{withdrawal.withdrawal_type}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Coin</span><span className="text-text-primary">{withdrawal.coin_name} ({withdrawal.coin_symbol})</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Network</span><span className="text-text-primary">{withdrawal.network}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="text-text-primary font-semibold">{Number(withdrawal.amount).toLocaleString()} {withdrawal.coin_symbol}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">USD value</span><span className="text-text-primary">{formatUSD(withdrawal.amount_usd)}</span></div>
          <div className="flex flex-col gap-1">
            <span className="text-text-muted">Destination address</span>
            <span className="text-text-primary font-mono text-xs break-all">{withdrawal.destination_address}</span>
          </div>
          {withdrawal.completed_at && (
            <div className="flex justify-between"><span className="text-text-muted">Completed</span><span className="text-text-primary text-xs">{new Date(withdrawal.completed_at).toLocaleString()}</span></div>
          )}
          <div className="flex justify-between"><span className="text-text-muted">Created</span><span className="text-text-primary text-xs">{withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleString() : '-'}</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isFinalised}
              className="w-full bg-root-bg border border-card-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue disabled:opacity-60"
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
              TX Hash {newStatus === 'completed' ? '(required)' : '(optional)'}
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="On-chain transaction hash"
              className="w-full bg-root-bg border border-card-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-medium">
            Admin notes {newStatus === 'rejected' ? '(rejection reason)' : ''}
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes or rejection reason"
            rows={4}
            className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue"
          />
          <div className="text-text-muted text-xs mt-1.5">
            Rejecting refunds the user&apos;s balance and emails them. Completing emails the TX hash.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-sm font-semibold bg-transparent cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave(withdrawal, {
                newStatus: 'rejected',
                adminNotes,
                txHash,
              })
            }
            disabled={saving || isFinalised || !adminNotes.trim()}
            className="px-4 py-2.5 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '...' : 'Reject'}
          </button>
          <button
            onClick={() =>
              onSave(withdrawal, { newStatus, adminNotes, txHash })
            }
            disabled={
              saving ||
              isFinalised ||
              (newStatus === 'completed' && !txHash.trim())
            }
            className="flex-1 py-2.5 rounded-lg bg-primary-blue hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
