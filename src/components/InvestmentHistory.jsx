import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatUSD } from '../utils/formatters'

const STATUS_STYLES = {
  pending:  'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-profit/15 text-profit',
  rejected: 'bg-loss/15 text-loss',
}

function truncateHash(hash) {
  if (!hash) return '-'
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

export default function InvestmentHistory() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRows = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('investment_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error(error)
    setRows(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border">
        <div className="text-text-primary font-semibold">Investment requests</div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-text-muted text-sm">
          Loading investments...
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-text-muted text-sm">
          No investment requests yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-widest text-text-muted">
                <th className="py-3 px-4 font-medium">Coin</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">TX Hash</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = (r.status || 'pending').toLowerCase()
                const style = STATUS_STYLES[status] || STATUS_STYLES.pending
                return (
                  <tr
                    key={r.id}
                    className="border-b border-card-border last:border-b-0 hover:bg-root-bg/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="text-text-primary font-semibold">
                        {r.coin_name}
                      </div>
                      <div className="text-text-muted text-xs uppercase">
                        {r.coin_symbol}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-text-primary font-medium">
                      {formatUSD(r.amount_usd)}
                    </td>
                    <td className="py-4 px-4 text-text-muted font-mono text-xs">
                      {truncateHash(r.tx_hash)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${style}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-text-muted text-xs">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
