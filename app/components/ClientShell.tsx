'use client'
import { useState, useEffect, useCallback } from 'react'
import type { MatchupResult, FilterState, MatchupsResponse, SortState } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { TOP_PLAYS_LIMIT, applyFilters, buildTaggedRecommendedDoubles, formatSlateDate, selectTopPlays, sortMatchups, suggestRecommendedDoubles } from '@/lib/utils'
import type { RecommendedDouble } from '@/lib/utils'
import StatusBar from './StatusBar'
import DatePicker from './DatePicker'
import LoadingSkeleton from './LoadingSkeleton'
import TopPlays from './TopPlays'
import Filters from './Filters'
import MatchupTable from './MatchupTable'

type MatchupsMeta = Pick<MatchupsResponse, 'date' | 'fetchedAt' | 'slateLockedAt' | 'gamesScanned' | 'gamesSkipped' | 'matchupsFound' | 'debug'>

export default function ClientShell() {
  const [date, setDate] = useState(formatSlateDate)
  const [allMatchups, setAllMatchups] = useState<MatchupResult[]>([])
  const [meta, setMeta] = useState<MatchupsMeta | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>({ column: 'gameTime', direction: 'asc' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const hasEstimatedUpcoming = allMatchups.some(m => m.gameStatus === 'upcoming' && m.lineupSource === 'estimated')
  const hasOpenLockedSlots = Boolean(
    meta?.debug.lockState === 'locked'
    && meta.debug.trackedCount < TOP_PLAYS_LIMIT
    && meta.debug.estimatedQualifyingUpcomingCount > 0
  )
  const backgroundRefreshMs = hasEstimatedUpcoming || hasOpenLockedSlots ? 30_000 : 300_000

  const fetchMatchups = useCallback(async (d: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matchups?date=${d}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: MatchupsResponse = await res.json()
      setAllMatchups(data.results)
      setMeta({ date: data.date, fetchedAt: data.fetchedAt, slateLockedAt: data.slateLockedAt, gamesScanned: data.gamesScanned, gamesSkipped: data.gamesSkipped, matchupsFound: data.matchupsFound, debug: data.debug })
    } catch {
      setError('Could not load MLB data. Try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatchups(date)
  }, [date, fetchMatchups])

  // Re-render every 60s so the upcoming/in-progress split stays current
  // without requiring a manual refresh.
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Silently refresh data every 5 min (matches KV cache TTL).
  // No loading spinner — data swaps in when ready.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/matchups?date=${date}`, { cache: 'no-store' })
        if (!res.ok) return
        const data: MatchupsResponse = await res.json()
        setAllMatchups(data.results)
        setMeta({ date: data.date, fetchedAt: data.fetchedAt, slateLockedAt: data.slateLockedAt, gamesScanned: data.gamesScanned, gamesSkipped: data.gamesSkipped, matchupsFound: data.matchupsFound, debug: data.debug })
      } catch {
        // silent — don't disrupt the user for a background refresh failure
      }
    }, backgroundRefreshMs)
    return () => clearInterval(id)
  }, [backgroundRefreshMs, date])

  const handleSort = (column: keyof MatchupResult) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const now = Date.now() + tick * 0 // tick dependency keeps this fresh every 60s

  const allUpcoming   = allMatchups.filter(m => m.gameStatus === 'upcoming')
  const allInProgress = allMatchups.filter(m => m.gameStatus === 'inProgress')
  const allSettled    = allMatchups.filter(m => m.gameStatus === 'settled')

  const upcoming   = sortMatchups(applyFilters(allUpcoming, filters), sort)
  const inProgress = sortMatchups(applyFilters(allInProgress, filters), sort)
  const settled    = applyFilters(allSettled, filters)
  const csvMatchups = [...upcoming, ...inProgress]

  const totalUpcoming   = allUpcoming.length
  const totalInProgress = allInProgress.length
  const hasActiveOptionalFilters = filters.minOPS !== null || filters.minH !== null
  const filtersKey = `${filters.minOPS ?? 'none'}-${filters.minH ?? 'none'}`

  const trackedUpcoming = upcoming
  const trackedInProgress = inProgress
  const trackedSettled = settled
  const topPlaysMatchups = selectTopPlays(allUpcoming)
  const lockedRecommendedDoubles = meta?.slateLockedAt ? buildTaggedRecommendedDoubles(allMatchups) : []
  const recommendedDoubles: RecommendedDouble[] = lockedRecommendedDoubles.length > 0
    ? lockedRecommendedDoubles
    : suggestRecommendedDoubles(trackedUpcoming)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <DatePicker date={date} onChange={setDate} />
        <StatusBar
          fetchedAt={meta?.fetchedAt ?? null}
          gamesScanned={meta?.gamesScanned ?? 0}
          gamesSkipped={meta?.gamesSkipped ?? 0}
          onRefresh={() => fetchMatchups(date)}
          isLoading={isLoading}
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton date={date} />
      ) : (
        <>
          <TopPlays matchups={trackedUpcoming} overrideRecommendedDoubles={recommendedDoubles} now={now} slateLockedAt={meta?.slateLockedAt ?? null} />
          <Filters
            key={filtersKey}
            date={date}
            filters={filters}
            onApply={setFilters}
            matchups={csvMatchups}
            topPlays={topPlaysMatchups}
            recommendedDoubles={recommendedDoubles}
          />
          <MatchupTable
            matchups={trackedUpcoming}
            sort={sort}
            onSort={handleSort}
            totalMatchups={totalUpcoming}
            hasActiveOptionalFilters={hasActiveOptionalFilters}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            gameKind="upcoming"
          />
          {inProgress.length > 0 && (
            <div className="mt-6">
              <MatchupTable
                matchups={trackedInProgress}
                sort={sort}
                onSort={handleSort}
                totalMatchups={totalInProgress}
                title="In progress"
                gameKind="inProgress"
              />
            </div>
          )}
          {settled.length > 0 && (
            <div className="mt-6">
              <MatchupTable
                matchups={trackedSettled}
                sort={sort}
                onSort={() => {}}
                totalMatchups={allSettled.length}
                title="Settled"
                gameKind="settled"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
