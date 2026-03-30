export interface MatchupResult {
  batterId: number
  batterName: string
  batterTeam: string
  batterTeamId: number
  pitcherId: number
  pitcherName: string
  pitcherTeam: string
  gameTime: string           // ISO string, display in ET
  isHome: boolean
  lineupSource: 'confirmed' | 'estimated'
  lineupPosition?: number    // 1-9 if confirmed lineup; undefined for estimated

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

  confidence: 'high' | 'medium' | 'low'  // 30+ AB, 15-29 AB, 10-14 AB
}

export interface FilterState {
  minAB: number    // default 15
  minOPS: number   // default 0.950
  minSLG: number   // default 0.500
  minAVG: number   // default 0.300
  minHR: number    // default 1
}

export const DEFAULT_FILTERS: FilterState = {
  minAB: 15,
  minOPS: 0.950,
  minSLG: 0.500,
  minAVG: 0.300,
  minHR: 1,
}

export interface MatchupsResponse {
  date: string
  fetchedAt: string
  gamesScanned: number      // each game in a doubleheader counted separately
  gamesSkipped: number      // games skipped due to missing probable pitcher
  matchupsFound: number     // count after server-side AB < 10 exclusion
  results: MatchupResult[]
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
