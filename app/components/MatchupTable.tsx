'use client'
import type { MatchupResult, SortState } from '@/lib/types'
import MatchupRow from './MatchupRow'

interface Props {
  matchups: MatchupResult[]
  sort: SortState
  onSort: (column: keyof MatchupResult) => void
  totalMatchups: number       // pre-filter count, for displaying "N of M"
  onResetFilters: () => void  // called when user clicks Reset Filters in empty state
}

const COLUMNS: Array<{ key: keyof MatchupResult; label: string }> = [
  { key: 'batterName', label: 'Batter' },
  { key: 'batterTeam', label: 'Team' },
  { key: 'pitcherName', label: 'Pitcher' },
  { key: 'ab', label: 'AB' },
  { key: 'h', label: 'H' },
  { key: 'hr', label: 'HR' },
  { key: 'xbh', label: 'XBH' },
  { key: 'slg', label: 'SLG' },
  { key: 'ops', label: 'OPS' },
  { key: 'avg', label: 'AVG' },
  { key: 'gameTime', label: 'Game' },
  { key: 'lineupSource', label: 'Lineup' },
]

export default function MatchupTable({ matchups, sort, onSort, totalMatchups, onResetFilters }: Props) {
  const sortIcon = (key: keyof MatchupResult) => {
    if (sort.column !== key) return <span className="text-gray-700 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sort.direction === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Qualifying Matchups
        </h2>
        <span className="text-xs text-gray-600">
          {matchups.length} of {totalMatchups} matchups
        </span>
      </div>

      {matchups.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm space-y-3">
          <p>No matchups meet your criteria — try relaxing the filters.</p>
          <button
            onClick={onResetFilters}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60">
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => onSort(col.key)}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap"
                  >
                    {col.label}{sortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matchups.map(m => (
                <MatchupRow key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`} matchup={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
