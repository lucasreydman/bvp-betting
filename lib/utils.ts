import type { FilterState, MatchupResult, SortState } from './types'

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

/** Relative time until first pitch. Returns null if start is in the past or invalid. */
export function formatCountdownToStart(isoString: string, nowMs: number): string | null {
  const start = new Date(isoString).getTime()
  if (Number.isNaN(start)) return null
  const diffMs = start - nowMs
  if (diffMs <= 0) return null
  const totalMins = Math.floor(diffMs / 60_000)
  if (totalMins < 1) return 'in <1m'
  if (totalMins < 60) return `in ${totalMins}m`
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h < 24) return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`
  const d = Math.floor(h / 24)
  const remH = h % 24
  return remH === 0 ? `in ${d}d` : `in ${d}d ${remH}h`
}

export function applyFilters(matchups: MatchupResult[], filters: FilterState): MatchupResult[] {
  return matchups.filter(m =>
    m.ab >= filters.minAB &&
    m.ops >= filters.minOPS &&
    m.slg >= filters.minSLG &&
    m.avg >= filters.minAVG
  )
}

export function sortMatchups(matchups: MatchupResult[], sort: SortState): MatchupResult[] {
  return [...matchups].sort((a, b) => {
    const aVal = a[sort.column]
    const bVal = b[sort.column]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal)
      return sort.direction === 'desc' ? -cmp : cmp
    }
    const diff = (aVal as number) - (bVal as number)
    return sort.direction === 'desc' ? -diff : diff
  })
}

export function generateCSV(matchups: MatchupResult[]): string {
  const headers = [
    'Batter', 'Team', 'Pitcher', 'Opp Team', 'Game Time',
    'AB', 'H', '2B', '3B', 'HR', 'BB', 'K', 'RBI',
    'AVG', 'SLG', 'OBP', 'OPS', 'XBH',
    'Confidence', 'Lineup Source',
  ]
  const rows = matchups.map(m => [
    m.batterName, m.batterTeam, m.pitcherName, m.pitcherTeam,
    formatTime(m.gameTime),
    m.ab, m.h, m.doubles, m.triples, m.hr, m.bb, m.k, m.rbi,
    m.avg.toFixed(3), m.slg.toFixed(3), m.obp.toFixed(3), m.ops.toFixed(3), m.xbh,
    m.confidence, m.lineupSource,
  ])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
