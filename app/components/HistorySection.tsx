'use client'
import { useState, useEffect } from 'react'
import type { HistoryEntry, AllTimeStats, StatsBucket } from '@/lib/types'

function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD — parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function pct(n: number, d: number): string {
  if (d === 0) return '—'
  return `${Math.round((n / d) * 100)}%`
}

function StatsBucketRow({ label, bucket, isSmash }: { label: string; bucket: StatsBucket; isSmash?: boolean }) {
  const resolved = bucket.total - bucket.pending
  const winRate = pct(bucket.wins, resolved)
  const legHits = bucket.wins * 2 + bucket.splits
  const legTotal = resolved * 2
  const legPct = pct(legHits, legTotal)
  const color = isSmash ? 'text-orange-400' : 'text-yellow-400'

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      <span className={`font-semibold w-32 shrink-0 ${color}`}>{label}</span>
      <span className="text-gray-300 font-mono">
        <span className="text-green-400">{bucket.wins}W</span>
        {' · '}
        <span className="text-yellow-400">{bucket.splits}S</span>
        {' · '}
        <span className="text-red-400">{bucket.losses}L</span>
        {bucket.pending > 0 && <span className="text-gray-600"> · {bucket.pending} pending</span>}
      </span>
      <span className="text-gray-500 text-xs">{winRate} win rate · {legPct} legs hit</span>
      {resolved === 0 && <span className="text-gray-600 text-xs">No resolved results yet</span>}
    </div>
  )
}

function AllTimeStatsCard({ stats }: { stats: AllTimeStats }) {
  return (
    <div className="mb-4 rounded-lg border border-gray-800 bg-gray-950 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">All-Time Performance</div>
      <div className="space-y-2.5">
        <StatsBucketRow label="Daily Double" bucket={stats.overall} />
        {stats.smash.total > 0 && (
          <StatsBucketRow label="Smash Double" bucket={stats.smash} isSmash />
        )}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm pt-1 border-t border-gray-800/60">
          <span className="text-gray-400 font-semibold w-32 shrink-0">Individual legs</span>
          <span className="text-gray-300 font-mono">
            {stats.legs.hits} / {stats.legs.total} hit
            {stats.legs.pending > 0 && <span className="text-gray-600"> · {stats.legs.pending} pending</span>}
          </span>
          <span className="text-gray-500 text-xs">{pct(stats.legs.hits, stats.legs.total)} hit rate</span>
        </div>
      </div>
    </div>
  )
}

function OutcomeBadge({ firstHit, secondHit }: { firstHit: boolean | null; secondHit: boolean | null }) {
  if (firstHit === null && secondHit === null) {
    return <span className="text-[10px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 uppercase tracking-wide">Pending</span>
  }
  if (firstHit && secondHit) {
    return <span className="text-[10px] font-bold text-green-400 border border-green-500/40 bg-green-950/30 rounded px-1.5 py-0.5 uppercase tracking-wide">Win</span>
  }
  if (!firstHit && !secondHit) {
    return <span className="text-[10px] font-bold text-red-400 border border-red-500/40 bg-red-950/30 rounded px-1.5 py-0.5 uppercase tracking-wide">Loss</span>
  }
  return <span className="text-[10px] font-bold text-yellow-400 border border-yellow-500/40 bg-yellow-950/20 rounded px-1.5 py-0.5 uppercase tracking-wide">Split</span>
}

function LegResult({ hit }: { hit: boolean | null }) {
  if (hit === null) return <span className="text-gray-600 text-xs">?</span>
  return hit
    ? <span className="text-green-400 text-xs font-bold">Hit</span>
    : <span className="text-red-400 text-xs">No hit</span>
}

export default function HistorySection() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [stats, setStats] = useState<AllTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch('/api/history?days=30').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ])
      .then(([histData, statsData]) => {
        setEntries(histData.entries ?? [])
        if (!statsData.error) setStats(statsData as AllTimeStats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  const hasData = entries.some(e => e.dailyDoubleFirst !== null)

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span className="font-semibold uppercase tracking-wider text-[11px]">Daily Double History</span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 bg-gray-900 rounded-lg p-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading history...</p>
          ) : (
            <>
              {stats && <AllTimeStatsCard stats={stats} />}
              {!hasData ? (
                <p className="text-gray-500 text-sm">No history yet. Today&apos;s Daily Double will appear here tomorrow once results are in.</p>
              ) : (
                <div className="space-y-2">
                  {entries.filter(e => e.dailyDoubleFirst !== null).map(entry => (
                    <div
                      key={entry.date}
                      className={`rounded-lg border px-3 py-2.5 ${
                        entry.dailyDoubleIsSmash
                          ? 'border-orange-500/30 bg-orange-950/10'
                          : 'border-gray-800 bg-gray-950'
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-gray-400 text-xs font-medium">{formatDate(entry.date)}</span>
                        {entry.dailyDoubleIsSmash && (
                          <span className="text-[10px] text-orange-400 border border-orange-500/40 rounded px-1 py-0.5 uppercase tracking-wide">Smash</span>
                        )}
                        {entry.outcome && (
                          <OutcomeBadge firstHit={entry.outcome.firstHit} secondHit={entry.outcome.secondHit} />
                        )}
                      </div>

                      {/* Legs */}
                      <div className="space-y-1">
                        {([
                          { leg: entry.dailyDoubleFirst, hit: entry.outcome?.firstHit ?? null },
                          { leg: entry.dailyDoubleSecond, hit: entry.outcome?.secondHit ?? null },
                        ] as const).map(({ leg, hit }, i) => {
                          if (!leg) return null
                          return (
                            <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                              <span className="text-gray-600 font-mono w-4 shrink-0">#{i + 1}</span>
                              <span className="text-white font-medium">{leg.batterName}</span>
                              <span className="text-gray-500">vs {leg.pitcherName}</span>
                              <span className="text-gray-400 font-mono">{leg.avg.toFixed(3)} AVG</span>
                              <span className="text-gray-600 font-mono">{leg.ab} AB</span>
                              <LegResult hit={hit} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
