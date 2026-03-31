'use client'
import { useState, useEffect, useCallback } from 'react'
import type { MatchupResult, FilterState, MatchupsResponse, SortState } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { applyFilters, sortMatchups } from '@/lib/utils'
import StatusBar from './StatusBar'
import DatePicker from './DatePicker'
import LoadingSkeleton from './LoadingSkeleton'
import TopPlays from './TopPlays'
import Filters from './Filters'
import MatchupTable from './MatchupTable'

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

  const fetchMatchups = useCallback(async (d: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matchups?date=${d}`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: MatchupsResponse = await res.json()
      setAllMatchups(data.results)
      setMeta({ date: data.date, fetchedAt: data.fetchedAt, gamesScanned: data.gamesScanned, gamesSkipped: data.gamesSkipped, matchupsFound: data.matchupsFound })
    } catch (err) {
      setError('Could not load MLB data. Try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatchups(date)
  }, [date, fetchMatchups])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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
          <TopPlays matchups={upcoming} />
          <Filters filters={filters} onApply={setFilters} matchups={csvMatchups} />
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
    </div>
  )
}
