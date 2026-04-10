export default function StatCard({ label, value, subtext, tone = 'neutral' }) {
  const toneColor =
    tone === 'positive'
      ? 'text-profit'
      : tone === 'negative'
        ? 'text-loss'
        : 'text-text-primary'

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="text-xs uppercase tracking-widest text-text-muted font-medium mb-2">
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${toneColor}`}>
        {value}
      </div>
      {subtext != null && (
        <div
          className={`mt-1 text-xs font-medium ${
            tone === 'positive'
              ? 'text-profit'
              : tone === 'negative'
                ? 'text-loss'
                : 'text-text-muted'
          }`}
        >
          {subtext}
        </div>
      )}
    </div>
  )
}
