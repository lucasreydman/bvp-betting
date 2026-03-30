import type { FilterState, MatchupResult, SortState } from './types'

export function formatET(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
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
    formatET(m.gameTime),
    m.ab, m.h, m.doubles, m.triples, m.hr, m.bb, m.k, m.rbi,
    m.avg.toFixed(3), m.slg.toFixed(3), m.obp.toFixed(3), m.ops.toFixed(3), m.xbh,
    m.confidence, m.lineupSource,
  ])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
