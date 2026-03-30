import { NextRequest, NextResponse } from 'next/server'
import { fetchSchedule, fetchConfirmedLineup, fetchActiveRoster, fetchCareerPA, fetchBvP, fetchPlayerName } from '@/lib/mlb-api'
import { calcStats, assignConfidence } from '@/lib/stats'
import { createCache } from '@/lib/cache'
import type { MatchupResult, MatchupsResponse } from '@/lib/types'

// Module-level caches — survive across requests in the same serverless instance
const bvpCache = createCache<{ split: any }>(3600_000)       // 60 min
const rosterCache = createCache<number[]>(3600_000)           // 60 min
const playerNameCache = createCache<string>(86400_000)        // 24h

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

async function getLineupPlayerIds(gamePk: number, teamId: number): Promise<{ ids: number[]; source: 'confirmed' | 'estimated' }> {
  // Try confirmed lineup first
  const confirmed = await fetchConfirmedLineup(gamePk, teamId)
  if (confirmed && confirmed.length >= 8) {
    return { ids: confirmed, source: 'confirmed' }
  }

  // Fall back to top-9 active roster by career PA
  const cacheKey = `roster:${teamId}`
  const cached = rosterCache.get(cacheKey)
  if (cached) return { ids: cached, source: 'estimated' }

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

  rosterCache.set(cacheKey, top9)
  return { ids: top9, source: 'estimated' }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  try {
    const games = await fetchSchedule(date)
    let gamesScanned = 0
    let gamesSkipped = 0
    const allPairs: Array<{
      batterId: number
      batterTeam: string
      batterTeamId: number
      pitcherId: number
      pitcherName: string
      pitcherTeam: string
      gameTime: string
      isHome: boolean
      lineupSource: 'confirmed' | 'estimated'
      lineupPosition?: number
    }> = []

    for (const game of games) {
      gamesScanned++
      const { home, away } = game.teams
      if (!home.probablePitcher || !away.probablePitcher) {
        gamesSkipped++
        continue
      }

      // Home batters vs away pitcher
      const homeLineup = await getLineupPlayerIds(game.gamePk, home.team.id)
      homeLineup.ids.forEach((batterId, i) => {
        allPairs.push({
          batterId,
          batterTeam: home.team.name,
          batterTeamId: home.team.id,
          pitcherId: away.probablePitcher!.id,
          pitcherName: away.probablePitcher!.fullName,
          pitcherTeam: away.team.name,
          gameTime: game.gameDate,
          isHome: true,
          lineupSource: homeLineup.source,
          lineupPosition: homeLineup.source === 'confirmed' ? i + 1 : undefined,
        })
      })

      // Away batters vs home pitcher
      const awayLineup = await getLineupPlayerIds(game.gamePk, away.team.id)
      awayLineup.ids.forEach((batterId, i) => {
        allPairs.push({
          batterId,
          batterTeam: away.team.name,
          batterTeamId: away.team.id,
          pitcherId: home.probablePitcher!.id,
          pitcherName: home.probablePitcher!.fullName,
          pitcherTeam: home.team.name,
          gameTime: game.gameDate,
          isHome: false,
          lineupSource: awayLineup.source,
          lineupPosition: awayLineup.source === 'confirmed' ? i + 1 : undefined,
        })
      })
    }

    // Fetch BvP data in batches of 20 with 200ms pause between batches
    const results: MatchupResult[] = []
    for (let i = 0; i < allPairs.length; i += BATCH_SIZE) {
      const batch = allPairs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async pair => {
          const cacheKey = `${pair.batterId}:${pair.pitcherId}`
          let split = bvpCache.get(cacheKey)?.split
          if (!split) {
            const fetched = await fetchBvP(pair.batterId, pair.pitcherId)
            if (!fetched || fetched.stat.atBats === 0) return null
            split = fetched
            bvpCache.set(cacheKey, { split })
          }

          const raw = {
            ab: split.stat.atBats,
            h: split.stat.hits,
            doubles: split.stat.doubles,
            triples: split.stat.triples,
            hr: split.stat.homeRuns,
            bb: split.stat.baseOnBalls,
            hbp: split.stat.hitByPitch,
            sf: split.stat.sacFlies,
            k: split.stat.strikeOuts,
            rbi: split.stat.rbi,
          }

          if (raw.ab < 10) return null

          const calculated = calcStats(raw)
          const confidence = assignConfidence(raw.ab)
          const batterName = await getPlayerName(pair.batterId)

          return {
            ...pair,
            batterName,
            ...raw,
            ...calculated,
            confidence,
          } satisfies MatchupResult
        })
      )

      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value !== null) {
          results.push(r.value)
        }
      }

      if (i + BATCH_SIZE < allPairs.length) await sleep(BATCH_DELAY_MS)
    }

    const response: MatchupsResponse = {
      date,
      fetchedAt: new Date().toISOString(),
      gamesScanned,
      gamesSkipped,
      matchupsFound: results.length,
      results,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Matchups error:', err)
    return NextResponse.json({ error: 'Failed to fetch matchup data' }, { status: 502 })
  }
}
