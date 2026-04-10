import { supabase } from '../lib/supabase'
import { formatUSD } from '../utils/formatters'

export default function AlertCard({ alert, onChange }) {
  const triggered = !!alert.triggered_at
  const active = !!alert.is_active

  async function toggleActive() {
    const { error } = await supabase
      .from('alerts')
      .update({ is_active: !active })
      .eq('id', alert.id)
    if (error) {
      console.error(error)
      return
    }
    onChange?.()
  }

  async function remove() {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alert.id)
    if (error) return console.error(error)
    onChange?.()
  }

  const status = triggered
    ? { label: 'Triggered', color: 'bg-profit/15 text-profit' }
    : active
      ? { label: 'Active', color: 'bg-primary-blue/15 text-primary-blue' }
      : { label: 'Paused', color: 'bg-text-subtle/15 text-text-muted' }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {alert.image && (
          <img
            src={alert.image}
            alt={alert.symbol}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="min-w-0">
          <div className="text-text-primary font-semibold">
            {alert.name}{' '}
            <span className="text-text-muted text-xs uppercase">{alert.symbol}</span>
          </div>
          <div className="text-text-muted text-xs">
            Notify when price{' '}
            <span className="text-text-primary font-medium">{alert.condition}</span>{' '}
            <span className="text-text-primary font-medium">
              {formatUSD(alert.target_price)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 rounded text-xs font-semibold uppercase ${status.color}`}
        >
          {status.label}
        </span>
        <button
          onClick={toggleActive}
          className="px-3 py-1.5 rounded-lg border border-card-border text-text-primary hover:border-primary-blue text-xs font-semibold bg-transparent cursor-pointer transition-colors"
        >
          {active ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={remove}
          className="px-3 py-1.5 rounded-lg border border-card-border text-text-muted hover:border-loss hover:text-loss text-xs font-semibold bg-transparent cursor-pointer transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
