'use client'

import { formatSlateDate } from '@/lib/utils'

interface Props {
  date: string        // YYYY-MM-DD
  onChange: (date: string) => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function DatePicker({ date, onChange }: Props) {
  const today = formatSlateDate()
  const minDate = today
  const maxDate = addDays(today, 1)
  const canGoBack = date > minDate
  const canGoForward = date < maxDate

  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.9))] px-2 py-2 shadow-[0_12px_30px_rgba(2,6,23,0.24)] sm:w-auto sm:min-w-[18rem] sm:justify-between">
      <button
        type="button"
        onClick={() => canGoBack && onChange(addDays(date, -1))}
        disabled={!canGoBack}
        aria-label="Previous date"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/90 text-lg text-slate-200 transition-all duration-200 hover:border-sky-400/40 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        ‹
      </button>
      <div className="min-w-0 flex-1 rounded-xl border border-slate-800/80 bg-slate-950/65 px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Slate Date</div>
        <span className="mt-0.5 block truncate text-sm font-semibold text-white sm:text-[0.95rem]">
          {formatDisplay(date)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => canGoForward && onChange(addDays(date, 1))}
        disabled={!canGoForward}
        aria-label="Next date"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/90 text-lg text-slate-200 transition-all duration-200 hover:border-sky-400/40 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        ›
      </button>
    </div>
  )
}
