'use client'

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function DatePicker({ date, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const minDate = addDays(today, -3)
  const maxDate = addDays(today, 3)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addDays(date, -1))}
        disabled={date <= minDate}
        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800 rounded text-sm transition-colors"
      >
        ‹
      </button>
      <input
        type="date"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
      />
      <span className="text-gray-400 text-sm hidden sm:block">{formatDisplay(date)}</span>
      <button
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= maxDate}
        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800 rounded text-sm transition-colors"
      >
        ›
      </button>
    </div>
  )
}
