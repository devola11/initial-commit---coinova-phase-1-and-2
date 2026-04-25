import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLES = {
  open:        { bg: '#F59E0B20', fg: '#F59E0B', label: 'Open' },
  in_progress: { bg: '#0052FF20', fg: '#0052FF', label: 'In Progress' },
  resolved:    { bg: '#05B16920', fg: '#05B169', label: 'Resolved' },
  closed:      { bg: '#8A919E20', fg: '#8A919E', label: 'Closed' },
}

const PRIORITY_STYLES = {
  low:    { bg: '#8A919E20', fg: '#8A919E', label: 'Low' },
  high:   { bg: '#F59E0B20', fg: '#F59E0B', label: 'High' },
  urgent: { bg: '#F6465D20', fg: '#F6465D', label: 'Urgent' },
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  )
}

function PriorityBadge({ priority }) {
  if (!priority || priority === 'normal') return null
  const p = PRIORITY_STYLES[priority]
  if (!p) return null
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
      style={{ background: p.bg, color: p.fg }}
    >
      {p.label}
    </span>
  )
}

function TicketCard({ ticket, expanded, onToggle }) {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className="w-full text-left p-5 bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-muted text-xs font-mono">#{ticket.ticket_number}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <span className="text-text-muted text-xs">{formatDate(ticket.created_at)}</span>
        </div>
        <div className="text-text-primary font-semibold text-sm mb-1 break-words">
          {ticket.subject}
        </div>
        <div className="text-text-muted text-xs">{ticket.category}</div>

        <div className="mt-3 flex items-center gap-2 text-xs text-primary-blue">
          {expanded ? 'Hide details' : 'View details'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-card-border px-5 py-4 space-y-4">
          <div>
            <div className="text-text-muted text-[11px] uppercase tracking-widest mb-1.5 font-medium">
              Your message
            </div>
            <div className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
              {ticket.message}
            </div>
          </div>

          {ticket.admin_response ? (
            <div className="bg-root-bg border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary-blue/15 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <div className="text-text-primary text-sm font-semibold">Coinova Support</div>
                  {ticket.resolved_at && (
                    <div className="text-text-muted text-[11px]">Replied {formatDate(ticket.resolved_at)}</div>
                  )}
                </div>
              </div>
              <div className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.admin_response}
              </div>
            </div>
          ) : (
            <div className="bg-root-bg border border-dashed border-card-border rounded-lg p-4 text-center">
              <div className="text-text-muted text-sm">
                Awaiting response — we typically reply within 24 hours.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setTickets(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            My Tickets
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Track your support requests and view replies from our team.
          </p>
        </div>
        <Link
          to="/contact"
          className="px-4 py-2.5 rounded-lg bg-primary-blue hover:opacity-90 text-white text-sm font-semibold no-underline transition-opacity whitespace-nowrap"
        >
          New ticket
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card-bg border border-card-border rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 w-32 bg-root-bg rounded mb-3" />
              <div className="h-5 w-3/4 bg-root-bg rounded mb-2" />
              <div className="h-3 w-24 bg-root-bg rounded" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card-bg border border-card-border rounded-xl p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-blue/10 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="text-text-primary font-semibold mb-1">No tickets yet</div>
          <p className="text-text-muted text-sm mb-5">
            Need help with something? Submit a ticket and we'll get back to you.
          </p>
          <Link
            to="/contact"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary-blue hover:opacity-90 text-white text-sm font-semibold no-underline transition-opacity"
          >
            Submit a ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
