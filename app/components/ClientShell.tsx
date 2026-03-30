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

interface Props {
  initialDate: string
}

export default function ClientShell({ initialDate }: Props) {
  const [date, setDate] = useState(initialDate)
  const [allMatchups, setAllMatchups] = useState<MatchupResult[]>([])
  const [meta, setMeta] = useState<Omit<MatchupsResponse, 'results'> | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>({ column: 'slg', direction: 'desc' })
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
      setError('Unable to fetch MLB data — please try again later.')
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

  const filtered = applyFilters(allMatchups, filters)
  const sorted = sortMatchups(filtered, sort)

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
          <TopPlays matchups={allMatchups} filters={filters} />
          <Filters filters={filters} onApply={setFilters} matchups={sorted} />
          <MatchupTable
            matchups={sorted}
            sort={sort}
            onSort={handleSort}
            totalMatchups={allMatchups.length}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        </>
      )}
    </div>
  )
}
