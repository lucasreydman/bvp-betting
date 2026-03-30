'use client'
import { formatTime } from '@/lib/utils'

interface Props {
  fetchedAt: string | null
  gamesScanned: number
  gamesSkipped: number
  onRefresh: () => void
  isLoading: boolean
}

export default function StatusBar({ fetchedAt, gamesScanned, gamesSkipped, onRefresh, isLoading }: Props) {
  return (
    <div className="flex items-center gap-6 text-sm text-gray-400">
      <div className="flex gap-4 flex-1 min-w-0">
        {fetchedAt && (
          <span className="whitespace-nowrap">Last updated: {formatTime(fetchedAt)}</span>
        )}
        {gamesScanned > 0 && (
          <span className="whitespace-nowrap">
            {gamesScanned} games scanned
            {gamesSkipped > 0 ? `, ${gamesSkipped} skipped (no probable pitcher)` : ''}
          </span>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors ml-auto"
      >
        <span className={isLoading ? 'animate-spin inline-block' : ''}>↻</span>
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}
