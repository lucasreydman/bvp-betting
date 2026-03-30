'use client'
import { formatET } from '@/lib/utils'

interface Props {
  fetchedAt: string | null
  gamesScanned: number
  gamesSkipped: number
  onRefresh: () => void
  isLoading: boolean
}

export default function StatusBar({ fetchedAt, gamesScanned, gamesSkipped, onRefresh, isLoading }: Props) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
      <div className="flex gap-4">
        {fetchedAt && (
          <span>Last updated: {formatET(fetchedAt)}</span>
        )}
        {gamesScanned > 0 && (
          <span>{gamesScanned} games scanned{gamesSkipped > 0 ? `, ${gamesSkipped} skipped (pitchers TBD)` : ''}</span>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-xs font-medium transition-colors"
      >
        {isLoading ? 'Loading...' : '↻ Refresh'}
      </button>
    </div>
  )
}
