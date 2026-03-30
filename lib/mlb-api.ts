const BASE = 'https://statsapi.mlb.com/api/v1'

// --- Raw MLB API response shapes (partial — only fields we use) ---

interface MLBProbablePitcher {
  id: number
  fullName: string
}

interface MLBGame {
  gamePk: number
  gameDate: string  // ISO string
  teams: {
    home: { team: { id: number; name: string }; probablePitcher?: MLBProbablePitcher }
    away: { team: { id: number; name: string }; probablePitcher?: MLBProbablePitcher }
  }
}

interface MLBRosterPlayer {
  person: { id: number; fullName: string }
  status?: { description: string }
}

interface MLBBvPSplit {
  stat: {
    atBats: number
    hits: number
    doubles: number
    triples: number
    homeRuns: number
    baseOnBalls: number
    hitByPitch: number
    sacFlies: number
    strikeOuts: number
    rbi: number
  }
}

interface MLBCareerSplit {
  stat: {
    plateAppearances: number
  }
}

// --- Public API functions ---

export async function fetchSchedule(date: string): Promise<MLBGame[]> {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,lineups`
  const res = await fetch(url, { next: { revalidate: 900 } }) // 15 min
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`)
  const data = await res.json()
  return data.dates?.[0]?.games ?? []
}

export async function fetchConfirmedLineup(gamePk: number, teamId: number): Promise<number[] | null> {
  const url = `${BASE}/game/${gamePk}/boxscore`
  const res = await fetch(url, { next: { revalidate: 900 } }) // 15 min
  if (!res.ok) return null
  const data = await res.json()
  const side = data.teams?.home?.team?.id === teamId ? 'home' : 'away'
  // The MLB boxscore `batters` field is an array of numeric player IDs
  const batters: Array<number | { id: number }> = data.teams?.[side]?.batters ?? []
  const ids = batters.map((b: any) => (typeof b === 'number' ? b : b.id)).filter(Boolean)
  return ids.length > 0 ? ids : null
}

export async function fetchActiveRoster(teamId: number): Promise<MLBRosterPlayer[]> {
  const url = `${BASE}/teams/${teamId}/roster?rosterType=active`
  const res = await fetch(url, { next: { revalidate: 3600 } }) // 60 min
  if (!res.ok) return []
  const data = await res.json()
  return data.roster ?? []
}

export async function fetchCareerPA(playerId: number): Promise<number> {
  const url = `${BASE}/people/${playerId}/stats?stats=career&group=hitting`
  const res = await fetch(url, { next: { revalidate: 3600 } }) // 60 min
  if (!res.ok) return 0
  const data = await res.json()
  const splits: MLBCareerSplit[] = data.stats?.[0]?.splits ?? []
  return splits[0]?.stat?.plateAppearances ?? 0
}

export async function fetchBvP(batterId: number, pitcherId: number): Promise<MLBBvPSplit | null> {
  const url = `${BASE}/people/${batterId}/stats?stats=vsPlayerTotal&opposingPlayerId=${pitcherId}&group=hitting`
  const res = await fetch(url)  // no revalidate — handled by in-memory cache in the route
  if (!res.ok) return null
  const data = await res.json()
  const splits: MLBBvPSplit[] = data.stats?.[0]?.splits ?? []
  if (splits.length === 0) return null
  return splits[0]
}

export async function fetchPlayerName(playerId: number): Promise<string> {
  const url = `${BASE}/people/${playerId}`
  const res = await fetch(url, { next: { revalidate: 86400 } }) // 24h — names don't change
  if (!res.ok) return `Player ${playerId}`
  const data = await res.json()
  return data.people?.[0]?.fullName ?? `Player ${playerId}`
}
