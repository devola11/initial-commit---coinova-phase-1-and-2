import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatUSD } from '../utils/formatters'

const STATUS_STYLES = {
  pending:      { bg: '#F59E0B20', fg: '#F59E0B', label: 'Pending' },
  under_review: { bg: '#0052FF20', fg: '#0052FF', label: 'Under Review' },
  approved:     { bg: '#7C3AED20', fg: '#7C3AED', label: 'Approved' },
  completed:    { bg: '#05B16920', fg: '#05B169', label: 'Completed' },
  rejected:     { bg: '#F6465D20', fg: '#F6465D', label: 'Rejected' },
}

function explorerUrl(coinSymbol, hash) {
  if (!hash) return null
  if (coinSymbol === 'BTC') return `https://blockstream.info/tx/${hash}`
  if (coinSymbol === 'ETH') return `https://etherscan.io/tx/${hash}`
  if (coinSymbol === 'USDT') return `https://tronscan.org/#/transaction/${hash}`
  return null
}

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase()
  const style = STATUS_STYLES[s] || STATUS_STYLES.pending
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: style.bg,
        color: style.fg,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {style.label}
    </span>
  )
}

function WithdrawalCard({ row }) {
  const [open, setOpen] = useState(false)
  const txUrl = explorerUrl(row.coin_symbol, row.tx_hash)

  return (
    <div
      style={{
        background: '#141519',
        border: '1px solid #1E2025',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#0052FF', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
              {row.request_number}
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              {Number(row.amount).toLocaleString()} {row.coin_symbol}
            </div>
            <div style={{ color: '#8A919E', fontSize: 12, marginTop: 2 }}>
              {formatUSD(row.amount_usd)} - {row.network}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={row.status} />
            <div style={{ color: '#8A919E', fontSize: 11, marginTop: 6 }}>
              {row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1E2025' }}>
          <Detail label="Type" value={(row.withdrawal_type || '').toUpperCase()} />
          <Detail label="Coin" value={`${row.coin_name} (${row.coin_symbol})`} />
          <Detail label="Network" value={row.network} />
          <Detail
            label="Destination"
            value={row.destination_address}
            mono
          />
          {row.tx_hash && (
            <Detail
              label="TX Hash"
              value={
                txUrl ? (
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0052FF' }}
                  >
                    {row.tx_hash}
                  </a>
                ) : (
                  row.tx_hash
                )
              }
              mono
            />
          )}
          {row.completed_at && (
            <Detail
              label="Completed"
              value={new Date(row.completed_at).toLocaleString()}
            />
          )}
          {row.admin_notes && (
            <Detail label="Notes" value={row.admin_notes} />
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, mono }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#8A919E' }}>{label}</span>
      <span
        style={{
          color: '#fff',
          textAlign: 'right',
          fontFamily: mono ? 'monospace' : 'inherit',
          fontSize: mono ? 12 : 13,
          maxWidth: '70%',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export default function MyWithdrawals() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        if (error) console.error(error)
        setRows(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight">
        My Withdrawals
      </h1>
      <p className="text-text-muted text-sm mb-6">
        Track every withdrawal request you have submitted.
      </p>

      {loading ? (
        <div style={{ color: '#8A919E', textAlign: 'center', padding: 40 }}>
          Loading...
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            No withdrawals yet
          </div>
          <p style={{ color: '#8A919E', fontSize: 14, marginBottom: 20 }}>
            Withdraw funds from your Main Wallet or CNC balance to get started.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-block',
              background: '#0052FF',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Go to dashboard
          </Link>
        </div>
      ) : (
        rows.map((r) => <WithdrawalCard key={r.id} row={r} />)
      )}
    </div>
  )
}
