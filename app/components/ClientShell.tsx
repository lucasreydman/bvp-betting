'use client'
import { useState, useEffect, useCallback } from 'react'
import type { MatchupResult, FilterState, MatchupsResponse, SortState } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { applyFilters, sortMatchups, suggestDailyDouble } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'
import StatusBar from './StatusBar'
import DatePicker from './DatePicker'
import LoadingSkeleton from './LoadingSkeleton'
import TopPlays from './TopPlays'
import Filters from './Filters'
import MatchupTable from './MatchupTable'
import HistorySection from './HistorySection'

function localToday(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}


export default function ClientShell() {
  const [date, setDate] = useState(localToday)
  const [allMatchups, setAllMatchups] = useState<MatchupResult[]>([])
  const [meta, setMeta] = useState<Omit<MatchupsResponse, 'results'> | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>({ column: 'avg', direction: 'desc' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<MatchupResult[] | null>(null)
  const [savedDailyDouble, setSavedDailyDouble] = useState<DailyDouble | null>(null)

  const fetchMatchups = useCallback(async (d: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matchups?date=${d}`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: MatchupsResponse = await res.json()
      setAllMatchups(data.results)
      setMeta({ date: data.date, fetchedAt: data.fetchedAt, gamesScanned: data.gamesScanned, gamesSkipped: data.gamesSkipped, matchupsFound: data.matchupsFound })
    } catch {
      setError('Could not load MLB data. Try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatchups(date)
  }, [date, fetchMatchups])

  useEffect(() => {
    // Always fetch the pre-game snapshot — for past dates it's the primary data source,
    // for today it's the fallback once all games have started.
    setSnapshot(null)
    setSavedDailyDouble(null)
    let cancelled = false
    fetch(`/api/snapshot?date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setSnapshot(data.top5 ?? null)
          setSavedDailyDouble(data.dailyDouble ?? null)
        }
      })
      .catch(() => { if (!cancelled) { setSnapshot(null); setSavedDailyDouble(null) } })
    return () => { cancelled = true }
  }, [date])

  const handleSort = (column: keyof MatchupResult) => {
    setSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  const now = Date.now()
  const isStarted = (m: MatchupResult) => new Date(m.gameTime).getTime() <= now

  const filtered = applyFilters(allMatchups, filters)
  const upcoming = sortMatchups(filtered.filter(m => !isStarted(m)), sort)
  const inProgress = sortMatchups(filtered.filter(m => isStarted(m)), sort)
  const csvMatchups = [...upcoming, ...inProgress]

  const totalUpcoming = allMatchups.filter(m => !isStarted(m)).length
  const totalInProgress = allMatchups.filter(m => isStarted(m)).length

  const isPast = date < localToday()
  // For today: show live upcoming games; once all have started fall back to the
  // pre-game snapshot so the Top 5 and Daily Double remain visible all day.
  const allGamesStarted = !isPast && upcoming.length === 0 && totalInProgress > 0
  const topPlaysMatchups = isPast || allGamesStarted ? applyFilters(snapshot ?? [], filters) : upcoming

  const top5Score = (m: MatchupResult) => m.avg * Math.min(m.ab / 30, 1)

  // Top 5 for display + "Top 5 Plays" CSV: upcoming only (bettable)
  const top5Matchups = [...topPlaysMatchups]
    .sort((a, b) => top5Score(b) - top5Score(a) || b.avg - a.avg || b.ab - a.ab)
    .slice(0, 5)

  // Daily Double: use the frozen pre-game snapshot once games have started or for past dates.
  // While upcoming games still exist, compute live from the current top-5.
  const allDayTop5 = [...filtered]
    .sort((a, b) => top5Score(b) - top5Score(a) || b.avg - a.avg || b.ab - a.ab)
    .slice(0, 5)
  const csvDailyDouble: DailyDouble | null = isPast || allGamesStarted
    ? savedDailyDouble
    : suggestDailyDouble(allDayTop5)

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
        <LoadingSkeleton />
      ) : (
        <>
          {!isPast && totalInProgress > 0 && (
            <div className="mb-4 rounded-lg border border-sky-800/50 bg-sky-950/20 px-4 py-3 text-sm text-sky-300">
              <p className="font-semibold mb-1">Some games have already started</p>
              <p className="text-sky-400/80 leading-relaxed">
                Stats and the Daily Double are locked in from <span className="text-sky-300 font-medium">before first pitch</span> — they show career history against today&apos;s pitchers only, with nothing from today&apos;s game mixed in.
                If a player you expected isn&apos;t showing up, it&apos;s likely because this page wasn&apos;t opened before their game began, so no pre-game snapshot was saved for them.
              </p>
              <p className="mt-2 text-sky-400/60 text-xs">
                To avoid this: <span className="text-sky-300">open or refresh this page before the first game starts each day.</span> That&apos;s all it takes to lock in the stats.
              </p>
            </div>
          )}
          <TopPlays matchups={topPlaysMatchups} overrideDailyDouble={csvDailyDouble} now={now} />
          <Filters filters={filters} onApply={setFilters} matchups={csvMatchups} top5={top5Matchups} dailyDouble={csvDailyDouble} />
          <MatchupTable
            matchups={upcoming}
            sort={sort}
            onSort={handleSort}
            totalMatchups={totalUpcoming}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            gameKind="upcoming"
          />
          {(inProgress.length > 0 || totalInProgress > 0) && (
            <div className="mt-6">
              <MatchupTable
                matchups={inProgress}
                sort={sort}
                onSort={handleSort}
                totalMatchups={totalInProgress}
                title="In progress"
                gameKind="inProgress"
              />
            </div>
          )}
        </>
      )}
      <HistorySection />
    </div>
  )
}
