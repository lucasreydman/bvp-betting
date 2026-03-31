'use client'
import type { MatchupResult, SortState } from '@/lib/types'
import MatchupRow from './MatchupRow'

interface Props {
  matchups: MatchupResult[]
  sort: SortState
  onSort: (column: keyof MatchupResult) => void
  totalMatchups: number
  title?: string
  onResetFilters?: () => void
  /** Drives Game column: countdown vs live badge */
  gameKind?: 'upcoming' | 'inProgress'
}

const COLUMNS: Array<{ key: keyof MatchupResult; label: string; cls: string }> = [
  { key: 'batterName', label: 'Batter', cls: 'min-w-[9rem]' },
  { key: 'batterTeam', label: 'Team', cls: 'min-w-[13rem]' },
  { key: 'pitcherName', label: 'Pitcher', cls: 'min-w-[17rem]' },
  { key: 'avg', label: 'AVG', cls: 'min-w-[4.5rem]' },
  { key: 'h', label: 'H', cls: 'min-w-[3rem]' },
  { key: 'ab', label: 'AB', cls: 'min-w-[3rem]' },
  { key: 'ops', label: 'OPS', cls: 'min-w-[4.5rem]' },
  { key: 'gameTime', label: 'Game', cls: 'min-w-[10.5rem]' },
  { key: 'lineupSource', label: 'Lineup', cls: 'min-w-[6.5rem]' },
]

export default function MatchupTable({
  matchups,
  sort,
  onSort,
  totalMatchups,
  title = 'Upcoming',
  onResetFilters,
  gameKind = 'upcoming',
}: Props) {
  const sortIcon = (key: keyof MatchupResult) => {
    if (sort.column !== key) return <span className="text-gray-700 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sort.direction === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs text-gray-600">
          {matchups.length} of {totalMatchups} matchups
        </span>
      </div>

      {matchups.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm space-y-3">
          <p>No rows match these filters. Try lowering a minimum.</p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm table-auto">
            <colgroup>
              {COLUMNS.map(col => (
                <col key={col.key} className={col.cls} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-800/60">
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => onSort(col.key)}
                    className={`px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap ${col.cls}`}
                  >
                    {col.label}{sortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matchups.map(m => (
                <MatchupRow
                  key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`}
                  matchup={m}
                  gameKind={gameKind}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
