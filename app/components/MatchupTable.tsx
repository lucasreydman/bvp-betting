'use client'
import type { MatchupResult, SortState } from '@/lib/types'
import { teamAbbr } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import MatchupRow from './MatchupRow'
import GameTimeCell from './GameTimeCell'

interface Props {
  matchups: MatchupResult[]
  sort: SortState
  onSort: (column: keyof MatchupResult) => void
  totalMatchups: number
  title?: string
  onResetFilters?: () => void
  /** Drives Game column: countdown vs live badge */
  gameKind?: 'upcoming' | 'inProgress' | 'settled'
}

const COLUMNS: Array<{ key: keyof MatchupResult; label: string; cls: string }> = [
  { key: 'batterName', label: 'Batter', cls: 'min-w-[9rem]' },
  { key: 'pitcherName', label: 'Pitcher', cls: 'min-w-[14rem]' },
  { key: 'avg', label: 'AVG', cls: 'min-w-[4.5rem]' },
  { key: 'h', label: 'H', cls: 'min-w-[3rem]' },
  { key: 'ab', label: 'AB', cls: 'min-w-[3rem]' },
  { key: 'ops', label: 'OPS', cls: 'hidden sm:table-cell min-w-[4.5rem]' },
  { key: 'gameTime', label: 'Game', cls: 'min-w-[10.5rem]' },
  { key: 'lineupSource', label: 'Lineup', cls: 'hidden sm:table-cell min-w-[6.5rem]' },
]

const MOBILE_SORT_COLS: Array<{ key: keyof MatchupResult; label: string }> = [
  { key: 'avg', label: 'AVG' },
  { key: 'ab', label: 'AB' },
  { key: 'gameTime', label: 'Time' },
]

const CARD_LEFT_BORDER: Record<string, string> = {
  high: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-red-500',
}

const CARD_AVG_COLOR: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

function HitBadge({ hitResult }: { hitResult: MatchupResult['hitResult'] }) {
  if (hitResult === 'win')
    return <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-green-900/40 text-green-400">HIT</span>
  if (hitResult === 'loss')
    return <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-900/40 text-red-400">NO HIT</span>
  if (hitResult === 'pending')
    return <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-800 text-gray-500">–</span>
  return null
}

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

  const emptyState = (
    <div className="px-4 py-8 text-center text-gray-500 text-sm space-y-3">
      <p>No rows match these filters. Try lowering a minimum.</p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors touch-manipulation"
        >
          Reset Filters
        </button>
      )}
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs text-gray-600">
          {matchups.length} of {totalMatchups} matchups
        </span>
      </div>

      {matchups.length === 0 ? emptyState : (
        <>
          {/* ── Mobile card view ── */}
          <div className="sm:hidden">
            {/* Sort chips */}
            {gameKind !== 'settled' && (
              <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                <span className="text-xs text-gray-600">Sort:</span>
                <div className="flex gap-1.5">
                  {MOBILE_SORT_COLS.map(col => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors touch-manipulation ${
                        sort.column === col.key
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                          : 'border-gray-700 text-gray-500 active:text-gray-300'
                      }`}
                    >
                      {col.label}
                      {sort.column === col.key ? (sort.direction === 'desc' ? ' ↓' : ' ↑') : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cards */}
            <div className="divide-y divide-gray-800/60">
              {matchups.map(m => (
                <div
                  key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`}
                  className={`px-4 py-3 border-l-4 ${CARD_LEFT_BORDER[m.confidence]}`}
                >
                  {/* Row 1: Batter name + AVG + hit badge (in-progress/settled only) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-white text-sm truncate">{m.batterName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gameKind !== 'upcoming' && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Result</span>
                          <HitBadge hitResult={m.hitResult} />
                        </div>
                      )}
                      <span className={`font-mono font-bold text-sm ${CARD_AVG_COLOR[m.confidence]}`}>
                        {m.avg.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Team vs Pitcher */}
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs min-w-0">
                    <span className="shrink-0 text-gray-400 font-mono">{teamAbbr(m.batterTeam)}</span>
                    <span className="text-gray-600 shrink-0">vs</span>
                    <span className="text-gray-400 truncate flex-1 min-w-0">{m.pitcherName}</span>
                    <span className="text-gray-600 shrink-0 font-mono">[{teamAbbr(m.pitcherTeam)}]</span>
                  </div>

                  {/* Row 3: H/AB + lineup status + game time */}
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="font-mono">{m.h}/{m.ab} AB</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Lineup</span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        m.lineupSource === 'confirmed'
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-amber-900/40 text-amber-400'
                      }`} title={getLineupBadgeTitle(m)}>
                        {getLineupBadgeText(m)}
                      </span>
                    </div>
                    <GameTimeCell gameTime={m.gameTime} variant={gameKind} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Desktop table view ── */}
          <div className="hidden sm:block overflow-x-auto scrollbar-styled">
            <table className="w-full min-w-full sm:min-w-[1100px] text-sm table-auto">
              <colgroup>
                {COLUMNS.map(col => (
                  <col key={col.key} className={col.cls} />
                ))}
                {gameKind !== 'upcoming' && (
                  <col className="hidden sm:table-column min-w-[5rem]" />
                )}
              </colgroup>
              <thead>
                <tr className="bg-gray-800/60">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      {...(gameKind !== 'settled' ? { onClick: () => onSort(col.key) } : {})}
                      className={`px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider select-none whitespace-nowrap ${col.cls} ${gameKind !== 'settled' ? 'cursor-pointer hover:text-white' : ''}`}
                    >
                      {col.label}{gameKind !== 'settled' && sortIcon(col.key)}
                    </th>
                  ))}
                  {gameKind !== 'upcoming' && (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                      Result
                    </th>
                  )}
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
        </>
      )}
    </div>
  )
}
