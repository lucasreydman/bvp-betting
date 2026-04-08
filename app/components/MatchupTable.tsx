'use client'
import type { MatchupResult, SortState } from '@/lib/types'
import { teamAbbr } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import MatchupRow from './MatchupRow'
import GameTimeCell from './GameTimeCell'
import RecommendationTagBadge from './RecommendationTagBadge'

interface Props {
  matchups: MatchupResult[]
  sort: SortState
  onSort: (column: keyof MatchupResult) => void
  totalMatchups: number
  title?: string
  onResetFilters?: () => void
  hasActiveOptionalFilters?: boolean
  /** Drives Game column: countdown vs live badge */
  gameKind?: 'upcoming' | 'inProgress' | 'settled'
}

const COLUMNS: Array<{ key: keyof MatchupResult; label: string; cls: string }> = [
  { key: 'batterName', label: 'Batter', cls: 'w-[18rem]' },
  { key: 'pitcherName', label: 'Pitcher', cls: 'w-[18rem]' },
  { key: 'avg', label: 'AVG', cls: 'w-[4.5rem]' },
  { key: 'h', label: 'H', cls: 'w-[3.5rem]' },
  { key: 'ab', label: 'AB', cls: 'w-[3.5rem]' },
  { key: 'ops', label: 'OPS', cls: 'hidden sm:table-cell w-[5rem]' },
  { key: 'gameTime', label: 'Game', cls: 'w-[12.5rem]' },
  { key: 'lineupSource', label: 'Lineup', cls: 'hidden sm:table-cell w-[9.5rem]' },
]

const RESULT_COLUMN_CLASS = 'hidden sm:table-column w-[6.5rem]'

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
  hasActiveOptionalFilters = false,
  gameKind = 'upcoming',
}: Props) {
  const sortIcon = (key: keyof MatchupResult) => {
    if (sort.column !== key) return <span className="text-gray-700 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sort.direction === 'desc' ? '↓' : '↑'}</span>
  }

  const showFilterEmptyState = hasActiveOptionalFilters && totalMatchups > 0
  const emptyMessage = showFilterEmptyState
    ? 'No rows match these optional filters. Try lowering a minimum.'
    : gameKind === 'upcoming'
      ? 'No qualifying upcoming plays remain for this date.'
      : `No ${title.toLowerCase()} matchups are available.`

  const emptyState = (
    <div className="px-4 py-8 text-center text-gray-500 text-sm space-y-3">
      <p>{emptyMessage}</p>
      {showFilterEmptyState && onResetFilters && (
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
      <div className="px-4 py-3 border-b border-gray-800 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="px-4 py-3 border-b border-gray-800 space-y-2">
                <span className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold">Sort</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {MOBILE_SORT_COLS.map(col => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`text-xs px-2.5 py-2 rounded-lg border transition-colors touch-manipulation ${
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
                  {/* Row 1: Batter identity + AVG/result */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{m.batterName}</div>
                        <RecommendationTagBadge tags={m.recommendationTags} />
                      </div>
                      <div className="mt-0.5 text-gray-500 text-xs font-mono">{teamAbbr(m.batterTeam)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
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

                  {/* Row 2: Pitcher identity + game time */}
                  <div className="mt-1.5 flex items-start justify-between gap-3 text-xs min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-400 truncate">{m.pitcherName}</div>
                      <div className="mt-0.5 text-gray-600 font-mono">{teamAbbr(m.pitcherTeam)}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <GameTimeCell gameTime={m.gameTime} variant={gameKind} />
                    </div>
                  </div>

                  {/* Row 3: H/AB on left, lineup badge on right */}
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2 text-gray-500 min-w-0 flex-wrap">
                      <span className="font-mono">{m.h}/{m.ab} AB</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Lineup</span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        m.lineupSource === 'confirmed'
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-amber-900/40 text-amber-400'
                      }`} title={getLineupBadgeTitle(m)}>
                        {getLineupBadgeText(m)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Desktop table view ── */}
          <div className="hidden sm:block overflow-x-auto scrollbar-styled">
            <table className="w-full min-w-[1296px] text-sm table-fixed">
              <colgroup>
                {COLUMNS.map(col => (
                  <col key={col.key} className={col.cls} />
                ))}
                <col className={RESULT_COLUMN_CLASS} />
              </colgroup>
              <thead>
                <tr className="bg-gray-800/60">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      {...(gameKind !== 'settled' ? { onClick: () => onSort(col.key) } : {})}
                      className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider select-none whitespace-nowrap ${col.cls} ${gameKind !== 'settled' ? 'cursor-pointer hover:text-white' : ''}`}
                    >
                      {col.label}{gameKind !== 'settled' && sortIcon(col.key)}
                    </th>
                  ))}
                  {gameKind === 'upcoming' && (
                    <th
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:table-cell text-transparent select-none"
                      aria-hidden="true"
                    >
                      Result
                    </th>
                  )}
                  {gameKind !== 'upcoming' && (
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
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
