'use client'

import { formatLocalDate } from '@/lib/utils'

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
  const today = formatLocalDate()
  const minDate = addDays(today, -1)
  const maxDate = addDays(today, 1)

  return (
    <div className="flex items-center gap-3">
      {date > minDate && (
        <button
          type="button"
          onClick={() => onChange(addDays(date, -1))}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          ‹
        </button>
      )}
      <span className="text-white font-medium text-sm">{formatDisplay(date)}</span>
      {date < maxDate && (
        <button
          type="button"
          onClick={() => onChange(addDays(date, 1))}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          ›
        </button>
      )}
    </div>
  )
}
