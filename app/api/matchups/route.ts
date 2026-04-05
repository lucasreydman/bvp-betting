import { NextRequest, NextResponse } from 'next/server'
import { fetchSchedule, fetchConfirmedLineup, fetchActiveRoster, fetchCareerPA, fetchBvP, fetchPlayerName, fetchBoxscoreHitting, fetchRecentLineupPositions } from '@/lib/mlb-api'
import { getGameStatus, computeHitResult } from '@/lib/game-status'
import { parseSplit } from '@/lib/stats'
import { createCache } from '@/lib/cache'
import { kvGet, kvSet } from '@/lib/kv'
import { medianLineupPosition } from '@/lib/utils'
import type { MatchupResult, MatchupsResponse } from '@/lib/types'
import { fetchDayOdds, buildOddsMap, normalizePlayerName } from '@/lib/odds'

// Module-level caches — survive across requests in the same serverless instance
const bvpCache = createCache<ReturnType<typeof parseSplit>>(3600_000)  // 60 min
const rosterCache = createCache<number[]>(3600_000)           // 60 min
const playerNameCache = createCache<string>(86400_000)        // 24h
const lineupProjectionCache = createCache<Record<number, number>>(21600_000) // 6h

// IMPORTANT: playerNameCache and getPlayerName MUST be at module scope (here),
// NOT inside the GET handler — inside the handler they'd be re-created per request.
async function getPlayerName(id: number): Promise<string> {
  const cached = playerNameCache.get(String(id))
  if (cached) return cached
  const name = await fetchPlayerName(id)
  playerNameCache.set(String(id), name)
  return name
}

const BATCH_SIZE = 20
const BATCH_DELAY_MS = 200

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function buildProjectedPositions(teamId: number, targetDate: string, playerIds: number[]): Promise<Record<number, number>> {
  const recentPositions = await fetchRecentLineupPositions(teamId, targetDate)
  return Object.fromEntries(
    playerIds.map((playerId, index) => [playerId, medianLineupPosition(recentPositions.get(playerId) ?? []) ?? index + 1])
  )
}

async function getLineupPlayerIds(
  gamePk: number,
  teamId: number,
  gameStarted: boolean,
  scheduleLineup: number[],
  targetDate: string,
): Promise<{ ids: number[]; source: 'confirmed' | 'estimated'; projectedPositions?: Record<number, number> }> {
  // Schedule hydration gives us the posted pre-game lineup — use it if complete
  if (scheduleLineup.length >= 8) {
    return { ids: scheduleLineup, source: 'confirmed' }
  }

  // Boxscore has actual batters (in-progress/final) or posted lineup (pre-game)
  const confirmed = await fetchConfirmedLineup(gamePk, teamId)

  // Pre-game: require a full lineup (≥8) to be confident it's the real batting order
  // In-progress/final: accept any batters — even early innings have the right players
  if (confirmed && (confirmed.length >= 8 || (gameStarted && confirmed.length > 0))) {
    return { ids: confirmed, source: 'confirmed' }
  }

  // Game has started but we have no lineup data — don't fall back to estimated
  // roster; those players likely didn't bat or we have no reliable data.
  if (gameStarted) {
    return { ids: [], source: 'confirmed' }
  }

  // Pre-game estimated fallback: top-9 active roster by career PA
  const cacheKey = `roster:${teamId}`
  const cached = rosterCache.get(cacheKey)
  const projectionCacheKey = `projected-lineup:${teamId}:${targetDate}`

  if (cached) {
    let projected = lineupProjectionCache.get(projectionCacheKey)
    if (!projected) {
      projected = await buildProjectedPositions(teamId, targetDate, cached)
      lineupProjectionCache.set(projectionCacheKey, projected)
    }
    return { ids: cached, source: 'estimated', projectedPositions: projected }
  }

  const roster = await fetchActiveRoster(teamId)
  const withPA = await Promise.all(
    roster.map(async player => ({
      id: player.person.id,
      pa: await fetchCareerPA(player.person.id),
    }))
  )
  const top9 = withPA
    .sort((a, b) => b.pa - a.pa)
    .slice(0, 9)
    .map(p => p.id)

  const projectedPositions = await buildProjectedPositions(teamId, targetDate, top9)

  rosterCache.set(cacheKey, top9)
  lineupProjectionCache.set(projectionCacheKey, projectedPositions)
  return { ids: top9, source: 'estimated', projectedPositions }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  try {
    const responseCacheKey = `matchups-response:${date}`
    const cached = await kvGet<MatchupsResponse>(responseCacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const games = await fetchSchedule(date)
    const nowMs = Date.now()
    let gamesScanned = 0
    let gamesSkipped = 0

    // ── Separate upcoming from in-progress/settled ──────────────────────────
    const upcomingPairs: Array<{
      batterId: number
      batterTeam: string
      batterTeamId: number
      pitcherId: number
      pitcherName: string
      pitcherTeam: string
      gamePk: number
      gameTime: string
      isHome: boolean
      lineupSource: 'confirmed' | 'estimated'
      lineupPosition?: number
      predictedLineupPosition?: number
    }> = []

    const nonUpcomingGames: Array<{
      game: typeof games[number]
      gameStatus: 'inProgress' | 'settled'
    }> = []

    for (const game of games) {
      gamesScanned++
      const { home, away } = game.teams
      if (!home.probablePitcher || !away.probablePitcher) {
        gamesSkipped++
        continue
      }

      const gameStatus = getGameStatus(game.status.detailedState)

      if (gameStatus === 'upcoming') {
        // gameStarted is used only by getLineupPlayerIds to decide lineup source.
        // It is NOT used for routing to upcoming vs non-upcoming — that is gameStatus's job.
        const gameStarted = new Date(game.gameDate).getTime() <= nowMs
        const homeScheduleIds = game.lineups?.homePlayers?.map(p => p.id) ?? []
        const awayScheduleIds = game.lineups?.awayPlayers?.map(p => p.id) ?? []

        const [homeLineup, awayLineup] = await Promise.all([
          getLineupPlayerIds(game.gamePk, home.team.id, gameStarted, homeScheduleIds, date),
          getLineupPlayerIds(game.gamePk, away.team.id, gameStarted, awayScheduleIds, date),
        ])

        homeLineup.ids.forEach((batterId, i) => {
          upcomingPairs.push({
            batterId,
            batterTeam: home.team.name,
            batterTeamId: home.team.id,
            pitcherId: away.probablePitcher!.id,
            pitcherName: away.probablePitcher!.fullName,
            pitcherTeam: away.team.name,
            gamePk: game.gamePk,
            gameTime: game.gameDate,
            isHome: true,
            lineupSource: homeLineup.source,
            lineupPosition: homeLineup.source === 'confirmed' ? i + 1 : undefined,
            predictedLineupPosition: homeLineup.source === 'estimated' ? homeLineup.projectedPositions?.[batterId] : undefined,
          })
        })

        awayLineup.ids.forEach((batterId, i) => {
          upcomingPairs.push({
            batterId,
            batterTeam: away.team.name,
            batterTeamId: away.team.id,
            pitcherId: home.probablePitcher!.id,
            pitcherName: home.probablePitcher!.fullName,
            pitcherTeam: home.team.name,
            gamePk: game.gamePk,
            gameTime: game.gameDate,
            isHome: false,
            lineupSource: awayLineup.source,
            lineupPosition: awayLineup.source === 'confirmed' ? i + 1 : undefined,
            predictedLineupPosition: awayLineup.source === 'estimated' ? awayLineup.projectedPositions?.[batterId] : undefined,
          })
        })
      } else {
        nonUpcomingGames.push({ game, gameStatus })
      }
    }

    // ── Fetch BvP for upcoming pairs (batched, existing logic) ───────────────
    const upcomingRaw: MatchupResult[] = []
    for (let i = 0; i < upcomingPairs.length; i += BATCH_SIZE) {
      const batch = upcomingPairs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async pair => {
          const cacheKey = `${pair.batterId}:${pair.pitcherId}`
          let stats = bvpCache.get(cacheKey)
          if (!stats) {
            const fetched = await fetchBvP(pair.batterId, pair.pitcherId)
            if (!fetched || fetched.stat.atBats === 0) return null
            stats = parseSplit(fetched.stat)
            bvpCache.set(cacheKey, stats)
          }
          if (stats.ab < 15 || stats.avg < 0.300) return null
          const batterName = await getPlayerName(pair.batterId)
          return {
            ...pair,
            batterName,
            ...stats,
            gameStatus: 'upcoming' as const,
          } satisfies MatchupResult
        })
      )
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value !== null) {
          upcomingRaw.push(r.value)
        }
      }
      if (i + BATCH_SIZE < upcomingPairs.length) await sleep(BATCH_DELAY_MS)
    }

    // ── Dedup (upcoming only) ────────────────────────────────────────────────
    const statKey = (r: MatchupResult) =>
      `${r.pitcherId}:${r.batterTeamId}:${r.ab}:${r.h}:${r.doubles}:${r.triples}:${r.hr}:${r.bb}:${r.hbp}:${r.sf}`
    const keyCounts = new Map<string, number>()
    for (const r of upcomingRaw) keyCounts.set(statKey(r), (keyCounts.get(statKey(r)) ?? 0) + 1)
    const upcomingResults = upcomingRaw.filter(r => keyCounts.get(statKey(r))! < 3)

    // ── Attach consensus odds to upcoming rows (must run before KV snapshots) ─
    const oddsRows = await fetchDayOdds(date)
    const oddsMap = buildOddsMap(oddsRows)
    for (const row of upcomingResults) {
      const normalized = normalizePlayerName(row.batterName)
      const match = oddsMap.get(normalized)
      if (match) {
        row.consensusHitOddsAmerican = match.consensusHitOddsAmerican
        row.bookCount = match.bookCount
      } else {
        row.consensusHitOddsAmerican = null
        row.bookCount = undefined
      }
    }

    // ── Write per-game KV snapshots for upcoming games (fire-and-forget) ─────
    const byGame = new Map<number, MatchupResult[]>()
    for (const m of upcomingResults) {
      const arr = byGame.get(m.gamePk) ?? []
      arr.push(m)
      byGame.set(m.gamePk, arr)
    }
    for (const [gamePk, matchups] of byGame) {
      kvSet(`game-qualifying:${gamePk}`, matchups, 129600).catch(err =>
        console.error(`Failed to write snapshot for game ${gamePk}:`, err)
      )
    }

    // ── Process in-progress and settled games from KV snapshots ─────────────
    const nonUpcomingResults: MatchupResult[] = []
    for (const { game, gameStatus } of nonUpcomingGames) {
      const snapshot = await kvGet<MatchupResult[]>(`game-qualifying:${game.gamePk}`)
      if (!snapshot) continue   // no pre-game snapshot — cannot verify qualification

      const hitsMap = await fetchBoxscoreHitting(game.gamePk)
      for (const m of snapshot) {
        const h = hitsMap.get(m.batterId)?.h ?? 0
        nonUpcomingResults.push({
          ...m,
          gameStatus,
          hitResult: computeHitResult(h, gameStatus),
        })
      }
    }

    // ── Build and cache response ─────────────────────────────────────────────
    const results = [...upcomingResults, ...nonUpcomingResults]
    const response: MatchupsResponse = {
      date,
      fetchedAt: new Date().toISOString(),
      gamesScanned,
      gamesSkipped,
      matchupsFound: results.length,
      results,
    }

    kvSet(responseCacheKey, response, 300).catch(err =>
      console.error('Failed to cache matchups response:', err)
    )

    return NextResponse.json(response)
  } catch (err) {
    console.error('Matchups error:', err)
    return NextResponse.json({ error: 'Failed to fetch matchup data' }, { status: 502 })
  }
}
