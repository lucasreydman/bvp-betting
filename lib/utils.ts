import type { FilterState, MatchupResult, MatchupsDebugInfo, RecommendationTag, SortState } from './types'

export const TOP_PLAYS_LIMIT = 4

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

interface BuildMatchupsDebugInfoInput {
  slateLockedAt: string | null
  trackedCount: number
  qualifyingUpcomingCount: number
  confirmedQualifyingUpcomingCount: number
  estimatedQualifyingUpcomingCount: number
  confirmedSlatePoolCount: number
  gamesWithProbablePitchers: number
  gamesSkippedMissingProbable: number
}

export function buildMatchupsDebugInfo({
  slateLockedAt,
  trackedCount,
  qualifyingUpcomingCount,
  confirmedQualifyingUpcomingCount,
  estimatedQualifyingUpcomingCount,
  confirmedSlatePoolCount,
  gamesWithProbablePitchers,
  gamesSkippedMissingProbable,
}: BuildMatchupsDebugInfoInput): MatchupsDebugInfo {
  const lockState = slateLockedAt ? 'locked' : 'preLock'
  const skippedClause = gamesSkippedMissingProbable > 0
    ? ` ${pluralize(gamesSkippedMissingProbable, 'game')} ${gamesSkippedMissingProbable === 1 ? 'was' : 'were'} skipped for missing probable pitchers.`
    : ''
  const missingProbablesPressureClause = gamesSkippedMissingProbable > 0 && trackedCount < TOP_PLAYS_LIMIT
    ? ' Missing probable pitchers are also shrinking the candidate pool.'
    : ''

  if (lockState === 'locked') {
    if (trackedCount === 0) {
      const backfillClause = estimatedQualifyingUpcomingCount > 0
        ? ' Open slots can still fill if later lineups confirm.'
        : ''

      return {
        lockState,
        trackedCount,
        qualifyingUpcomingCount,
        confirmedQualifyingUpcomingCount,
        estimatedQualifyingUpcomingCount,
        confirmedSlatePoolCount,
        gamesWithProbablePitchers,
        gamesSkippedMissingProbable,
        explanation: `The official Top 4 locked at first pitch with no confirmed qualifying plays.${backfillClause}${skippedClause}`,
      }
    }

    const qualifierClause = trackedCount < TOP_PLAYS_LIMIT
      ? ` Only ${pluralize(confirmedSlatePoolCount, 'confirmed qualifier')} were available at lock time.`
      : ''
    const backfillClause = trackedCount < TOP_PLAYS_LIMIT && estimatedQualifyingUpcomingCount > 0
      ? ' Open slots can still fill as later lineups confirm.'
      : ''

    return {
      lockState,
      trackedCount,
      qualifyingUpcomingCount,
      confirmedQualifyingUpcomingCount,
      estimatedQualifyingUpcomingCount,
      confirmedSlatePoolCount,
      gamesWithProbablePitchers,
      gamesSkippedMissingProbable,
      explanation: `The official Top 4 locked at first pitch with ${pluralize(trackedCount, 'play')}.${qualifierClause}${backfillClause}${missingProbablesPressureClause}${skippedClause}`,
    }
  }

  if (qualifyingUpcomingCount === 0) {
    const probablePitcherClause = gamesWithProbablePitchers === 0
      ? 'No games are usable yet because probable pitchers have not been posted.'
      : `${pluralize(gamesWithProbablePitchers, 'game')} currently ${gamesWithProbablePitchers === 1 ? 'has' : 'have'} probable pitchers, but nothing meets the 15 AB / .300 AVG cutoff.`

    return {
      lockState,
      trackedCount,
      qualifyingUpcomingCount,
      confirmedQualifyingUpcomingCount,
      estimatedQualifyingUpcomingCount,
      confirmedSlatePoolCount,
      gamesWithProbablePitchers,
      gamesSkippedMissingProbable,
      explanation: `No qualifying upcoming plays yet. ${probablePitcherClause}${skippedClause}`,
    }
  }

  const refillClause = trackedCount < TOP_PLAYS_LIMIT
    ? ' Another qualifying play can still move in before first pitch.'
    : ''
  const estimatedClause = estimatedQualifyingUpcomingCount > 0
    ? `, ${pluralize(estimatedQualifyingUpcomingCount, 'estimated qualifier')}`
    : ''

  return {
    lockState,
    trackedCount,
    qualifyingUpcomingCount,
    confirmedQualifyingUpcomingCount,
    estimatedQualifyingUpcomingCount,
    confirmedSlatePoolCount,
    gamesWithProbablePitchers,
    gamesSkippedMissingProbable,
    explanation: `Showing ${pluralize(trackedCount, 'current candidate')} from ${pluralize(qualifyingUpcomingCount, 'qualifying upcoming play')} so far: ${pluralize(confirmedQualifyingUpcomingCount, 'confirmed qualifier')}${estimatedClause}.${refillClause}${missingProbablesPressureClause}${skippedClause}`,
  }
}

const TEAM_ABBR: Record<string, string> = {
  'Arizona Diamondbacks': 'ARI',
  'Atlanta Braves': 'ATL',
  'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS',
  'Chicago White Sox': 'CWS',
  'Chicago Cubs': 'CHC',
  'Cincinnati Reds': 'CIN',
  'Cleveland Guardians': 'CLE',
  'Colorado Rockies': 'COL',
  'Detroit Tigers': 'DET',
  'Houston Astros': 'HOU',
  'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA',
  'Los Angeles Dodgers': 'LAD',
  'Miami Marlins': 'MIA',
  'Milwaukee Brewers': 'MIL',
  'Minnesota Twins': 'MIN',
  'New York Yankees': 'NYY',
  'New York Mets': 'NYM',
  'Athletics': 'ATH',
  'Oakland Athletics': 'OAK',
  'Philadelphia Phillies': 'PHI',
  'Pittsburgh Pirates': 'PIT',
  'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF',
  'Seattle Mariners': 'SEA',
  'St. Louis Cardinals': 'STL',
  'Tampa Bay Rays': 'TB',
  'Texas Rangers': 'TEX',
  'Toronto Blue Jays': 'TOR',
  'Washington Nationals': 'WSH',
}

export function teamAbbr(teamName: string): string {
  return TEAM_ABBR[teamName] ?? teamName.split(' ').map(w => w[0]).join('').toUpperCase()
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const SLATE_TIME_ZONE = 'America/Los_Angeles'

export function formatDateInTimeZone(date = new Date(), timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error(`Unable to format date for time zone ${timeZone}`)
  }

  return `${year}-${month}-${day}`
}

export function formatSlateDate(date = new Date()): string {
  return formatDateInTimeZone(date, SLATE_TIME_ZONE)
}

export function getEarliestGameTimeMs(gameTimes: string[]): number | null {
  let earliest: number | null = null

  for (const gameTime of gameTimes) {
    const parsed = new Date(gameTime).getTime()
    if (Number.isNaN(parsed)) continue
    earliest = earliest === null ? parsed : Math.min(earliest, parsed)
  }

  return earliest
}

export function isSlateLockReached(gameTimes: string[], nowMs: number): boolean {
  const earliest = getEarliestGameTimeMs(gameTimes)
  if (earliest === null) return false
  return nowMs >= earliest
}

// Regression target is ~0.320 (conditional mean of pre-filtered matchups: min 15 AB, min .300 AVG)
// rather than the league-wide average of .260, which undershoots this pre-selected population.
export function regressedAvg(avg: number, ab: number, leagueAvg = 0.32, regStrength = 50): number {
  if (ab <= 0) return leagueAvg
  const weight = ab / (ab + regStrength)
  return weight * avg + (1 - weight) * leagueAvg
}

export function expectedAtBats(lineupPosition?: number): number {
  if (lineupPosition == null) return 4.1
  if (lineupPosition <= 3) return 4.45
  if (lineupPosition === 4) return 4.25
  if (lineupPosition <= 6) return 4.05
  return 3.85
}

export function resolveLineupPosition(matchup: Pick<MatchupResult, 'lineupPosition' | 'predictedLineupPosition'>): number | undefined {
  return matchup.lineupPosition ?? matchup.predictedLineupPosition
}

export function medianLineupPosition(positions: number[]): number | undefined {
  if (positions.length === 0) return undefined
  const sorted = [...positions].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function hitProbability(avg: number, atBats: number): number {
  return 1 - Math.pow(1 - avg, atBats)
}

export function topPlayScore(matchup: MatchupResult): number {
  return matchup.avg * Math.min(matchup.ab / 30, 1)
}

export function sortTopPlays(matchups: MatchupResult[]): MatchupResult[] {
  return [...matchups].sort((a, b) => topPlayScore(b) - topPlayScore(a) || b.avg - a.avg || b.ab - a.ab)
}

export function selectTopPlays(matchups: MatchupResult[], limit = TOP_PLAYS_LIMIT): MatchupResult[] {
  return sortTopPlays(matchups).slice(0, limit)
}

export function fillOpenTopPlaySlots(
  lockedTopPlays: MatchupResult[],
  candidatePool: MatchupResult[],
  limit = TOP_PLAYS_LIMIT,
): MatchupResult[] {
  const existingKeys = new Set(lockedTopPlays.map(matchup => matchupKey(matchup)))
  if (existingKeys.size >= limit) {
    return sortTopPlays(lockedTopPlays).slice(0, limit)
  }

  const additions = sortTopPlays(candidatePool.filter(matchup => !existingKeys.has(matchupKey(matchup))))
    .slice(0, Math.max(0, limit - existingKeys.size))

  return sortTopPlays([...lockedTopPlays, ...additions])
}

const CONFIDENCE_WEIGHTS: Record<MatchupResult['confidence'], number> = {
  high: 3,
  medium: 2,
  low: 1,
}

type EnrichedRecommendationLeg = {
  matchup: MatchupResult
  probability: number
}

export interface RecommendedDouble {
  first: MatchupResult
  second: MatchupResult
  firstProbability: number
  secondProbability: number
  combinedProbability: number
  isSmash: boolean  // true when both legs have OPS > 0.950 AND H >= 7
}

export function matchupKey(matchup: Pick<MatchupResult, 'gamePk' | 'batterId' | 'pitcherId'>): string {
  return `${matchup.gamePk}:${matchup.batterId}:${matchup.pitcherId}`
}

export function isSmashDouble(first: MatchupResult, second: MatchupResult): boolean {
  return first.ops > 0.950 && second.ops > 0.950 && first.h >= 7 && second.h >= 7
}

function buildRecommendationLeg(matchup: MatchupResult): EnrichedRecommendationLeg {
  return {
    matchup,
    probability: hitProbability(regressedAvg(matchup.avg, matchup.ab), expectedAtBats(resolveLineupPosition(matchup))),
  }
}

function compareLegs(a: EnrichedRecommendationLeg, b: EnrichedRecommendationLeg): number {
  if (b.probability !== a.probability) return b.probability - a.probability
  const confidenceDiff = CONFIDENCE_WEIGHTS[b.matchup.confidence] - CONFIDENCE_WEIGHTS[a.matchup.confidence]
  if (confidenceDiff !== 0) return confidenceDiff
  if (b.matchup.avg !== a.matchup.avg) return b.matchup.avg - a.matchup.avg
  return b.matchup.ab - a.matchup.ab
}

function buildRecommendedDouble(a: EnrichedRecommendationLeg, b: EnrichedRecommendationLeg): RecommendedDouble {
  const [first, second] = compareLegs(a, b) <= 0 ? [a, b] : [b, a]
  return {
    first: first.matchup,
    second: second.matchup,
    firstProbability: first.probability,
    secondProbability: second.probability,
    combinedProbability: first.probability * second.probability,
    isSmash: isSmashDouble(first.matchup, second.matchup),
  }
}

function doubleConfidenceScore(double: RecommendedDouble): number {
  return CONFIDENCE_WEIGHTS[double.first.confidence] + CONFIDENCE_WEIGHTS[double.second.confidence]
}

function compareRecommendedDoubles(a: RecommendedDouble, b: RecommendedDouble): number {
  if (a.isSmash !== b.isSmash) return a.isSmash ? -1 : 1
  if (b.combinedProbability !== a.combinedProbability) return b.combinedProbability - a.combinedProbability
  const confidenceDiff = doubleConfidenceScore(b) - doubleConfidenceScore(a)
  if (confidenceDiff !== 0) return confidenceDiff
  if (b.firstProbability !== a.firstProbability) return b.firstProbability - a.firstProbability
  if (b.secondProbability !== a.secondProbability) return b.secondProbability - a.secondProbability
  if (b.first.avg !== a.first.avg) return b.first.avg - a.first.avg
  return b.second.avg - a.second.avg
}

function totalCombinedProbability(doubles: RecommendedDouble[]): number {
  return doubles.reduce((sum, double) => sum + double.combinedProbability, 0)
}

function totalConfidence(doubles: RecommendedDouble[]): number {
  return doubles.reduce((sum, double) => sum + doubleConfidenceScore(double), 0)
}

function compareRecommendedDoubleSets(a: RecommendedDouble[], b: RecommendedDouble[]): number {
  const smashCountDiff = b.filter(double => double.isSmash).length - a.filter(double => double.isSmash).length
  if (smashCountDiff !== 0) return smashCountDiff

  const pairCount = Math.max(a.length, b.length)
  for (let index = 0; index < pairCount; index++) {
    const aDouble = a[index]
    const bDouble = b[index]
    if (!aDouble && bDouble) return 1
    if (aDouble && !bDouble) return -1
    if (!aDouble || !bDouble) continue
    const comparison = compareRecommendedDoubles(aDouble, bDouble)
    if (comparison !== 0) return comparison
  }

  const combinedProbabilityDiff = totalCombinedProbability(b) - totalCombinedProbability(a)
  if (combinedProbabilityDiff !== 0) return combinedProbabilityDiff

  return totalConfidence(b) - totalConfidence(a)
}

export function suggestRecommendedDoubles(matchups: MatchupResult[]): RecommendedDouble[] {
  const enriched = matchups
    .slice(0, TOP_PLAYS_LIMIT)
    .map(buildRecommendationLeg)

  if (enriched.length < 2) return []

  if (enriched.length < 4) {
    const candidates: RecommendedDouble[] = []
    for (let i = 0; i < enriched.length; i++) {
      for (let j = i + 1; j < enriched.length; j++) {
        candidates.push(buildRecommendedDouble(enriched[i], enriched[j]))
      }
    }
    return candidates.sort(compareRecommendedDoubles).slice(0, 1)
  }

  const partitions: RecommendedDouble[][] = [
    [buildRecommendedDouble(enriched[0], enriched[1]), buildRecommendedDouble(enriched[2], enriched[3])],
    [buildRecommendedDouble(enriched[0], enriched[2]), buildRecommendedDouble(enriched[1], enriched[3])],
    [buildRecommendedDouble(enriched[0], enriched[3]), buildRecommendedDouble(enriched[1], enriched[2])],
  ].map(doubles => doubles.sort(compareRecommendedDoubles))

  return partitions.sort(compareRecommendedDoubleSets)[0] ?? []
}

export function suggestDailyDouble(matchups: MatchupResult[]): RecommendedDouble | null {
  return suggestRecommendedDoubles(matchups)[0] ?? null
}

export function buildRecommendationTags(
  topPlays: MatchupResult[],
  recommendedDoubles: RecommendedDouble[],
): Record<string, RecommendationTag[]> {
  const tags: Record<string, RecommendationTag[]> = {}

  const appendTag = (key: string, tag: RecommendationTag) => {
    const existingTags = tags[key] ?? []
    if (existingTags.includes(tag)) return
    tags[key] = [...existingTags, tag]
  }

  for (const [index, double] of recommendedDoubles.entries()) {
    const tag: RecommendationTag = double.isSmash
      ? 'SMASH'
      : recommendedDoubles.length === 1 || index === 0
        ? 'DD'
        : 'SD'

    for (const leg of [double.first, double.second]) {
      appendTag(matchupKey(leg), tag)
    }
  }

  for (const matchup of topPlays) {
    appendTag(matchupKey(matchup), 'T4')
  }

  return tags
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
    (filters.minOPS === null || m.ops >= filters.minOPS) &&
    (filters.minH === null || m.h >= filters.minH)
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
    // null/undefined values sort to the bottom regardless of direction
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    const diff = (aVal as number) - (bVal as number)
    return sort.direction === 'desc' ? -diff : diff
  })
}

export function generateCSV(matchups: MatchupResult[]): string {
  const headers = [
    'Batter', 'Team', 'Pitcher', 'Opp Team', 'Game Time',
    'AB', 'H', '2B', '3B', 'HR', 'BB', 'K', 'RBI',
    'AVG', 'SLG', 'OBP', 'OPS', 'XBH',
    'Confidence', 'Lineup Slot', 'Lineup Source',
  ]
  const rows = matchups.map(m => [
    m.batterName, m.batterTeam, m.pitcherName, m.pitcherTeam,
    formatTime(m.gameTime),
    m.ab, m.h, m.doubles, m.triples, m.hr, m.bb, m.k, m.rbi,
    m.avg.toFixed(3), m.slg.toFixed(3), m.obp.toFixed(3), m.ops.toFixed(3), m.xbh,
    m.confidence, resolveLineupPosition(m) ?? '', m.lineupSource,
  ])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export function generateRecommendedDoublesCSV(doubles: RecommendedDouble[]): string {
  const headers = [
    'Double', 'Type', 'Combined Hit %', 'Leg',
    'Batter', 'Team', 'Pitcher', 'Opp Team', 'Game Time',
    'AB', 'H', 'AVG', 'OPS', 'Confidence', 'Lineup Slot', 'Lineup Source',
  ]

  const rows = doubles.flatMap((double, index) => {
    const type = double.isSmash ? 'Smash Double' : index === 0 ? 'Daily Double' : 'Secondary Double'
    return [
      { leg: double.first, legIndex: 1 },
      { leg: double.second, legIndex: 2 },
    ].map(({ leg, legIndex }) => [
      index + 1,
      type,
      `${(double.combinedProbability * 100).toFixed(2)}%`,
      legIndex,
      leg.batterName,
      leg.batterTeam,
      leg.pitcherName,
      leg.pitcherTeam,
      formatTime(leg.gameTime),
      leg.ab,
      leg.h,
      leg.avg.toFixed(3),
      leg.ops.toFixed(3),
      leg.confidence,
      resolveLineupPosition(leg) ?? '',
      leg.lineupSource,
    ])
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
