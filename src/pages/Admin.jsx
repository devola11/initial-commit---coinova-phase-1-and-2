import { useEffect, useState, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatUSD } from '../utils/formatters'

export const ADMIN_EMAIL = 'frontenddev177@gmail.com'

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

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
  if (!hash) return '—'
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

  useEffect(() => {
    if (isAdmin) fetchRows()
  }, [isAdmin, fetchRows])

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

  // Credit user: update holdings + insert transaction + mark request approved.
  async function approveRequest(row) {
    if (actioning) return
    setActioning(row.id)
    try {
      const price = Number(row.coin_price_at_submission) || 0
      if (price <= 0) {
        throw new Error('Missing reference price on request — cannot credit holdings')
      }
      const quantity = Number(row.amount_usd) / price

      const { data: existing, error: findErr } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', row.user_id)
        .eq('coin_id', row.coin_id)
        .maybeSingle()
      if (findErr) throw findErr

      if (existing) {
        const totalQty = Number(existing.quantity) + quantity
        const totalCost =
          Number(existing.buy_price_usd) * Number(existing.quantity) +
          price * quantity
        const newAvgPrice = totalCost / totalQty
        const { error: updErr } = await supabase
          .from('holdings')
          .update({ quantity: totalQty, buy_price_usd: newAvgPrice })
          .eq('id', existing.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from('holdings').insert({
          user_id: row.user_id,
          coin_id: row.coin_id,
          symbol: (row.coin_symbol || '').toLowerCase(),
          name: row.coin_name,
          image: row.coin_image || null,
          quantity,
          buy_price_usd: price,
        })
        if (insErr) throw insErr
      }

      const { error: txErr } = await supabase.from('transactions').insert({
        user_id: row.user_id,
        type: 'buy',
        coin_id: row.coin_id,
        symbol: (row.coin_symbol || '').toLowerCase(),
        name: row.coin_name,
        quantity,
        price_usd: price,
        total_usd: Number(row.amount_usd),
        fee_usd: 0,
      })
      if (txErr) throw txErr

      const { error: statusErr } = await supabase
        .from('investment_requests')
        .update({ status: 'approved' })
        .eq('id', row.id)
      if (statusErr) throw statusErr

      showToast('Investment approved and credited!')
      await fetchRows()
    } catch (err) {
      console.error(err)
      showToast(`Approve failed: ${err.message}`)
    } finally {
      setActioning(null)
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
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Admin — Investment Requests
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Approve or reject pending investment requests. Approving
          automatically credits the user's holdings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                          : '—'}
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
                            {r.admin_note || '—'}
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
