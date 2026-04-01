import { NextRequest, NextResponse } from 'next/server'
import { fetchSchedule, fetchConfirmedLineup, fetchActiveRoster, fetchCareerPA, fetchBvP, fetchPlayerName } from '@/lib/mlb-api'
import { parseSplit } from '@/lib/stats'
import { createCache } from '@/lib/cache'
import { kvGet, kvSet } from '@/lib/kv'
import { suggestDailyDouble, regressedAvg, expectedAtBats, hitProbability } from '@/lib/utils'
import type { MatchupResult, MatchupsResponse } from '@/lib/types'

// Module-level caches — survive across requests in the same serverless instance
const bvpCache = createCache<ReturnType<typeof parseSplit>>(3600_000)  // 60 min
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
      gamePk: number
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

      const [homeLineup, awayLineup] = await Promise.all([
        getLineupPlayerIds(game.gamePk, home.team.id),
        getLineupPlayerIds(game.gamePk, away.team.id),
      ])

      homeLineup.ids.forEach((batterId, i) => {
        allPairs.push({
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
        })
      })

      awayLineup.ids.forEach((batterId, i) => {
        allPairs.push({
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
        })
      })
    }

    // Load the pre-game stats snapshot for this date from KV.
    // This map is populated before games start and never overwritten once a game begins,
    // so it always reflects career BvP stats as of pre-game (not updated by live game stats).
    const pregameKey = `pregame:${date}`
    const pregameMap: Record<string, ReturnType<typeof parseSplit>> =
      await kvGet<Record<string, ReturnType<typeof parseSplit>>>(pregameKey) ?? {}
    let pregameMapUpdated = false

    const nowMs = Date.now()

    // Fetch BvP data in batches of 20 with 200ms pause between batches
    const results: MatchupResult[] = []
    for (let i = 0; i < allPairs.length; i += BATCH_SIZE) {
      const batch = allPairs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async pair => {
          const cacheKey = `${pair.batterId}:${pair.pitcherId}`
          const gameStarted = new Date(pair.gameTime).getTime() <= nowMs

          let stats: ReturnType<typeof parseSplit> | undefined

          if (gameStarted && pregameMap[cacheKey]) {
            // Game has started — serve frozen pre-game stats from KV.
            // Never re-fetch from the live API so today's game stats don't contaminate
            // the career BvP numbers we use for betting decisions.
            stats = pregameMap[cacheKey]
          } else {
            // Game hasn't started (or no frozen snapshot yet): use in-memory cache → API
            stats = bvpCache.get(cacheKey)
            if (!stats) {
              const fetched = await fetchBvP(pair.batterId, pair.pitcherId)
              if (!fetched || fetched.stat.atBats === 0) return null
              stats = parseSplit(fetched.stat)
              bvpCache.set(cacheKey, stats)
            }

            // Persist pre-game stats to KV only while the game hasn't started.
            // Once saved, they're never overwritten, locking in the pre-game numbers.
            if (!gameStarted && !pregameMap[cacheKey]) {
              pregameMap[cacheKey] = stats
              pregameMapUpdated = true
            }
          }

          if (!stats || stats.ab < 10) return null

          const batterName = await getPlayerName(pair.batterId)

          return {
            ...pair,
            batterName,
            ...stats,
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

    // Persist updated pre-game map to KV (fire-and-forget)
    if (pregameMapUpdated) {
      kvSet(pregameKey, pregameMap).catch(err =>
        console.error('Failed to save pregame snapshot:', err)
      )
    }

    // Drop results where 5+ batters on the same team vs the same pitcher share
    // identical raw stats — the MLB API sometimes returns team-aggregate data
    // instead of individual BvP records, making many batters look identical.
    const statKey = (r: MatchupResult) =>
      `${r.pitcherId}:${r.batterTeamId}:${r.ab}:${r.h}:${r.doubles}:${r.triples}:${r.hr}:${r.bb}:${r.hbp}:${r.sf}`
    const keyCounts = new Map<string, number>()
    for (const r of results) keyCounts.set(statKey(r), (keyCounts.get(statKey(r)) ?? 0) + 1)
    const deduped = results.filter(r => keyCounts.get(statKey(r))! < 5)

    const response: MatchupsResponse = {
      date,
      fetchedAt: new Date().toISOString(),
      gamesScanned,
      gamesSkipped,
      matchupsFound: deduped.length,
      results: deduped,
    }

    // Persist top-5 + daily double snapshot the first time this date is requested.
    // Only include games that haven't started yet so the snapshot reflects
    // pre-game top plays, not post-game ones.
    // Fire-and-forget — do not await, so it doesn't delay the response.
    const snapshotKey = `top5:${date}`
    const ddKey = `dd:${date}`
    kvGet<MatchupResult[]>(snapshotKey).then(async existing => {
      if (!existing) {
        const nowIso = new Date().toISOString()
        const upcomingOnly = deduped.filter(r => r.gameTime > nowIso)
        if (upcomingOnly.length === 0) return  // no pre-game data to snapshot yet

        const top5 = [...upcomingOnly]
          .sort((a, b) =>
            b.avg * Math.min(b.ab / 30, 1) - a.avg * Math.min(a.ab / 30, 1) ||
            b.avg - a.avg ||
            b.ab - a.ab
          )
          .slice(0, 5)

        await kvSet(snapshotKey, top5).catch(err =>
          console.error('Failed to save top-5 snapshot:', err)
        )

        // Also save the daily double for this date (from pre-game top-5 only)
        const existingDd = await kvGet(ddKey).catch(() => null)
        if (!existingDd) {
          const score = (m: MatchupResult) =>
            hitProbability(regressedAvg(m.avg, m.ab), expectedAtBats(m.lineupPosition))
          const enriched = top5.map(m => ({ m, probability: score(m) }))
          const dd = suggestDailyDouble(enriched.map(e => e.m))
          await kvSet(ddKey, dd ?? null).catch(err =>
            console.error('Failed to save daily double snapshot:', err)
          )
        }
      }
    }).catch(err => console.error('Failed to read snapshot:', err))

    return NextResponse.json(response)
  } catch (err) {
    console.error('Matchups error:', err)
    return NextResponse.json({ error: 'Failed to fetch matchup data' }, { status: 502 })
  }
}
