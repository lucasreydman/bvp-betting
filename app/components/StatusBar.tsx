'use client'
import { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils'

interface Props {
  fetchedAt: string | null
  gamesScanned: number
  gamesSkipped: number
  onRefresh: () => void
  isLoading: boolean
}

export default function StatusBar({ fetchedAt, gamesScanned, gamesSkipped, onRefresh, isLoading }: Props) {
  const [now, setNow] = useState<string>('')

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-3 sm:gap-6 text-sm text-gray-400 w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {now && <span className="whitespace-nowrap font-mono text-xs sm:text-sm">{now}</span>}
          {fetchedAt && (
            <span className="whitespace-nowrap text-xs sm:text-sm">
              Updated: {formatTime(fetchedAt)}
            </span>
          )}
        </div>
        {gamesScanned > 0 && (
          <span className="whitespace-nowrap text-xs hidden sm:inline">
            {gamesScanned} games scanned
            {gamesSkipped > 0 ? `, ${gamesSkipped} skipped` : ''}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors touch-manipulation ml-auto sm:ml-0"
      >
        <span className={isLoading ? 'animate-spin inline-block' : ''}>↻</span>
        <span>{isLoading ? 'Loading…' : 'Refresh'}</span>
      </button>
    </div>
  )
}
