import { NextRequest, NextResponse } from 'next/server'
import { fetchBoxscoreHitting, fetchSchedule } from '@/lib/mlb-api'
import { computeHitResult, getGameStatus } from '@/lib/game-status'
import {
  buildDiscordWebhookPayload,
  buildDiscordNotificationEvents,
  buildDiscordTopPlaysSnapshot,
  extendDiscordTopPlaysSnapshot,
  getDiscordSentKey,
  getDiscordSentTtlSeconds,
  getDiscordSnapshotKey,
  getDiscordSnapshotTtlSeconds,
  getNotificationLeadMinutes,
  shouldLockDiscordSnapshot,
} from '@/lib/discord-notifications'
import { kvDel, kvGet, kvSet } from '@/lib/kv'
import type { DiscordTopPlaysSnapshot, MatchupResult, MatchupsResponse } from '@/lib/types'
import { formatSlateDate, matchupKey } from '@/lib/utils'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function isAuthorized(req: NextRequest): boolean {
  const secrets = [process.env.DISCORD_NOTIFIER_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value)
  )
  if (secrets.length === 0) return true

  const bearer = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  return secrets.some(secret => bearer === `Bearer ${secret}` || querySecret === secret)
}

async function postDiscordMessage(webhookUrl: string, content: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildDiscordWebhookPayload(content)),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Discord webhook failed (${response.status}): ${body}`)
  }
}

async function fetchMatchups(req: NextRequest, date: string): Promise<MatchupsResponse> {
  const matchupsUrl = new URL('/api/matchups', req.url)
  matchupsUrl.searchParams.set('date', date)

  const response = await fetch(matchupsUrl.toString(), {
    cache: 'no-store',
    headers: NO_STORE_HEADERS,
  })

  if (!response.ok) {
    throw new Error(`Matchups request failed with status ${response.status}`)
  }

  return response.json() as Promise<MatchupsResponse>
}

async function hydrateSnapshotResults(date: string, snapshot: DiscordTopPlaysSnapshot): Promise<MatchupResult[]> {
  const games = await fetchSchedule(date)
  const gameStatusByPk = new Map(games.map(game => [game.gamePk, getGameStatus(game.status.detailedState)]))
  const nonUpcomingGamePks = [...new Set(
    snapshot.topPlays
      .map(matchup => matchup.gamePk)
      .filter(gamePk => gameStatusByPk.get(gamePk) && gameStatusByPk.get(gamePk) !== 'upcoming')
  )]

  const hitsByGame = new Map<number, Map<number, { h: number }>>()
  await Promise.all(nonUpcomingGamePks.map(async gamePk => {
    hitsByGame.set(gamePk, await fetchBoxscoreHitting(gamePk))
  }))

  return snapshot.topPlays.map(matchup => {
    const gameStatus = gameStatusByPk.get(matchup.gamePk) ?? matchup.gameStatus
    if (gameStatus === 'upcoming') {
      return {
        ...matchup,
        gameStatus,
        hitResult: undefined,
      }
    }

    const hitsMap = hitsByGame.get(matchup.gamePk)
    const h = hitsMap?.get(matchup.batterId)?.h ?? 0
    return {
      ...matchup,
      gameStatus,
      hitResult: computeHitResult(h, gameStatus),
    }
  })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const date = req.nextUrl.searchParams.get('date') ?? formatSlateDate()
  const isDryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const shouldReset = req.nextUrl.searchParams.get('reset') === '1'
  const leadMinutes = getNotificationLeadMinutes(req.nextUrl.searchParams.get('leadMinutes') ?? undefined)
  const sentKey = getDiscordSentKey(date)
  const snapshotKey = getDiscordSnapshotKey(date)

  try {
    if (shouldReset) {
      await kvDel(sentKey)
      await kvDel(snapshotKey)
      return NextResponse.json({ ok: true, date, reset: true }, { headers: NO_STORE_HEADERS })
    }

    const matchups = await fetchMatchups(req, date)
    const nowMs = Date.now()
    const cutoffReached = shouldLockDiscordSnapshot(matchups.earliestGameTime, nowMs, leadMinutes)
    let snapshot = await kvGet<DiscordTopPlaysSnapshot>(snapshotKey)
    let addedTopPlays: MatchupResult[] = []

    if (!snapshot && cutoffReached) {
      const nextSnapshot = buildDiscordTopPlaysSnapshot(matchups, new Date(nowMs).toISOString(), leadMinutes)
      if (nextSnapshot) {
        snapshot = nextSnapshot
        if (!isDryRun) {
          await kvSet(snapshotKey, snapshot, getDiscordSnapshotTtlSeconds())
        }
      }
    }

    if (snapshot) {
      const extended = extendDiscordTopPlaysSnapshot(snapshot, matchups)
      snapshot = extended.snapshot
      addedTopPlays = extended.addedTopPlays

      if (addedTopPlays.length > 0 && !isDryRun) {
        await kvSet(snapshotKey, snapshot, getDiscordSnapshotTtlSeconds())
      }
    }

    const snapshotResults = snapshot ? await hydrateSnapshotResults(date, snapshot) : []
    const events = snapshot
      ? buildDiscordNotificationEvents({
        date,
        snapshot,
        addedTopPlays,
        results: snapshotResults,
      })
      : []
    const sentIds = new Set(await kvGet<string[]>(sentKey) ?? [])
    const unsentEvents = events.filter(event => !sentIds.has(event.id))

    if (isDryRun || !process.env.DISCORD_WEBHOOK_URL) {
      return NextResponse.json({
        ok: true,
        date,
        dryRun: true,
        webhookConfigured: Boolean(process.env.DISCORD_WEBHOOK_URL),
        leadMinutes,
        cutoffReached,
        snapshotLockedAt: snapshot?.lockedAt ?? null,
        addedTopPlays: addedTopPlays.map(matchup => matchupKey(matchup)),
        totalEvents: events.length,
        unsentEvents: unsentEvents.map(event => ({ id: event.id, content: event.content })),
      }, { headers: NO_STORE_HEADERS })
    }

    for (const event of unsentEvents) {
      await postDiscordMessage(process.env.DISCORD_WEBHOOK_URL, event.content)
      sentIds.add(event.id)
    }

    await kvSet(sentKey, [...sentIds], getDiscordSentTtlSeconds())

    return NextResponse.json({
      ok: true,
      date,
      sentCount: unsentEvents.length,
      eventIds: unsentEvents.map(event => event.id),
    }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('Discord notifier error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Discord notifier failed',
    }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
