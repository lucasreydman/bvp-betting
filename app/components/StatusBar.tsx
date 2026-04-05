'use client'
import { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils'
import InfoTooltip from './InfoTooltip'

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
    const tick = () => setNow(new Date().toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short',
    }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-3 sm:gap-6 text-gray-400 w-full sm:w-auto">

      {/* Times: stacked on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
          {now && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Now</span>
              <span className="font-mono text-xs text-gray-400">{now}</span>
            </div>
          )}
          {fetchedAt && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Updated</span>
              <span className="font-mono text-xs text-gray-400">{formatTime(fetchedAt)}</span>
            </div>
          )}
        </div>

        {/* Games scanned / skipped — desktop only */}
        {gamesScanned > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
            <span>{gamesScanned} games scanned</span>
            {gamesSkipped > 0 && (
              <>
                <span>, {gamesSkipped} skipped</span>
                <InfoTooltip
                  width="w-72"
                  align="right"
                  text="Skipped means no probable pitcher was announced for one or both teams, so BvP stats can't be calculated. Postponed, cancelled, and suspended games are removed before counting and don't appear here at all."
                />
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors touch-manipulation"
      >
        <span className={isLoading ? 'animate-spin inline-block' : ''}>↻</span>
        <span>{isLoading ? 'Loading…' : 'Refresh'}</span>
      </button>
    </div>
  )
}
