export type RecommendationTag = 'SMASH' | 'DD' | 'SD' | 'T4'

export interface MatchupResult {
  batterId: number
  batterName: string
  batterTeam: string
  batterTeamId: number
  pitcherId: number
  pitcherName: string
  pitcherTeam: string
  gamePk: number             // MLB game ID
  gameTime: string           // ISO string, display in ET
  isHome: boolean
  lineupSource: 'confirmed' | 'estimated'
  lineupPosition?: number    // 1-9 if confirmed lineup; undefined for estimated
  predictedLineupPosition?: number  // 1-9 projected slot for estimated lineups

  // Raw counting stats
  ab: number
  h: number
  doubles: number
  triples: number
  hr: number
  bb: number
  hbp: number
  sf: number
  k: number
  rbi: number

  // Calculated
  avg: number
  slg: number
  obp: number
  ops: number
  xbh: number

  confidence: 'high' | 'medium' | 'low'  // 21+ AB = high, 18-20 AB = medium, 15-17 AB = low
  gameStatus: 'upcoming' | 'inProgress' | 'settled'
  hitResult?: 'win' | 'loss' | 'pending'   // only present on inProgress and settled rows
  recommendationTags?: RecommendationTag[]
}

export interface FilterState {
  minOPS: number | null  // null = not active; minAB (15) and minAVG (0.300) are server-enforced
  minH: number | null    // null = not active; optional secondary confidence filter
}

export const DEFAULT_FILTERS: FilterState = {
  minOPS: null,
  minH: null,
}

export interface MatchupsResponse {
  date: string
  fetchedAt: string
  slateLockedAt: string | null
  earliestGameTime: string | null
  gamesScanned: number      // each game in a doubleheader counted separately
  gamesSkipped: number      // games skipped due to missing probable pitcher
  matchupsFound: number     // count after server-side AB < 15 / AVG < .300 exclusion
  debug: MatchupsDebugInfo
  confirmedTopPlaysPreview?: MatchupResult[]
  results: MatchupResult[]
}

export interface MatchupsDebugInfo {
  lockState: 'preLock' | 'locked'
  trackedCount: number
  qualifyingUpcomingCount: number
  confirmedQualifyingUpcomingCount: number
  estimatedQualifyingUpcomingCount: number
  confirmedSlatePoolCount: number
  gamesWithProbablePitchers: number
  gamesSkippedMissingProbable: number
  explanation: string
}

export interface SlateTopPlaysSnapshot {
  date: string
  lockedAt: string
  topPlays: MatchupResult[]
}

export interface DiscordTopPlaysSnapshot {
  date: string
  lockedAt: string
  leadMinutes: number
  topPlays: MatchupResult[]
}

export interface ScheduleGame {
  gamePk: number
  gameTime: string
  homeTeam: string
  awayTeam: string
  homeProbablePitcher?: string
  awayProbablePitcher?: string
}

export interface ScheduleResponse {
  date: string
  gamesFound: number
  pitchersConfirmed: number
  games: ScheduleGame[]
}

export interface SortState {
  column: keyof MatchupResult
  direction: 'asc' | 'desc'
}

