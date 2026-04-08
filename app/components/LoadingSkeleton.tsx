'use client'
import { useState, useEffect } from 'react'
import { formatSlateDate } from '@/lib/utils'

interface Props {
  date: string  // YYYY-MM-DD
}

function dateLabel(date: string): string {
  const yesterday = formatSlateDate(new Date(Date.now() - 86400000))
  const tomorrow = formatSlateDate(new Date(Date.now() + 86400000))
  const dayAfter = formatSlateDate(new Date(Date.now() + 2 * 86400000))
  if (date === yesterday) return "yesterday's"
  if (date === tomorrow) return "tomorrow's"
  if (date === dayAfter) return "day after tomorrow's"
  return "today's"
}

export default function LoadingSkeleton({ date }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const message =
    elapsed < 5
      ? `Fetching ${dateLabel(date)} matchups\u2026`
      : elapsed < 15
        ? 'Loading lineups and BvP data\u2026'
        : elapsed < 30
          ? 'Almost there \u2014 processing remaining matchups\u2026'
          : 'Still working\u2026 large slate today.'

  return (
    <div className="animate-pulse space-y-4">
      {/* Progress message */}
      <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
        <span className="inline-block w-3 h-3 rounded-full bg-blue-600 animate-pulse shrink-0" />
        <span>{message}</span>
        {elapsed > 0 && <span className="text-gray-600 font-mono text-xs ml-auto">{elapsed}s</span>}
      </div>
      {/* Top plays skeleton */}
      <div className="bg-gray-900 rounded-lg p-4 h-40" />
      {/* Filters skeleton */}
      <div className="bg-gray-900 rounded-lg p-4 h-20" />
      {/* Table skeleton */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-800 mb-1" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-900 border-t border-gray-800" />
        ))}
      </div>
    </div>
  )
}
