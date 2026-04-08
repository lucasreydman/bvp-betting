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
  const maxDate = addDays(today, 2)

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 sm:w-auto sm:justify-start sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
      {date > minDate && (
        <button
          type="button"
          onClick={() => onChange(addDays(date, -1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400 transition-colors hover:text-white sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:text-lg"
        >
          ‹
        </button>
      )}
      <span className="min-w-0 flex-1 text-center text-sm font-medium text-white sm:flex-initial sm:text-left">
        {formatDisplay(date)}
      </span>
      {date < maxDate && (
        <button
          type="button"
          onClick={() => onChange(addDays(date, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400 transition-colors hover:text-white sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:text-lg"
        >
          ›
        </button>
      )}
    </div>
  )
}
