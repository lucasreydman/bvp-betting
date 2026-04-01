'use client'
import { useState, useEffect } from 'react'
import type { HistoryEntry } from '@/lib/types'

function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD — parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
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
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/history?days=14')
      .then(r => r.json())
      .then(data => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [open])

  const hasData = entries.some(e => e.dailyDoubleFirst !== null)

  return (
    <div className="mt-6">
      <button
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
          ) : !hasData ? (
            <p className="text-gray-500 text-sm">No saved daily doubles yet. They&apos;ll appear here after today&apos;s first visit pre-game.</p>
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
        </div>
      )}
    </div>
  )
}
