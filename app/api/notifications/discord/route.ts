import { NextRequest, NextResponse } from 'next/server'
import { buildDiscordNotificationEvents, getDiscordSentKey, getDiscordSentTtlSeconds } from '@/lib/discord-notifications'
import { kvDel, kvGet, kvSet } from '@/lib/kv'
import type { MatchupsResponse } from '@/lib/types'
import { formatSlateDate } from '@/lib/utils'

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
    body: JSON.stringify({ content }),
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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const date = req.nextUrl.searchParams.get('date') ?? formatSlateDate()
  const isDryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const shouldReset = req.nextUrl.searchParams.get('reset') === '1'
  const sentKey = getDiscordSentKey(date)

  try {
    if (shouldReset) {
      await kvDel(sentKey)
      return NextResponse.json({ ok: true, date, reset: true }, { headers: NO_STORE_HEADERS })
    }

    const matchups = await fetchMatchups(req, date)
    const events = buildDiscordNotificationEvents(matchups)
    const sentIds = new Set(await kvGet<string[]>(sentKey) ?? [])
    const unsentEvents = events.filter(event => !sentIds.has(event.id))

    if (isDryRun || !process.env.DISCORD_WEBHOOK_URL) {
      return NextResponse.json({
        ok: true,
        date,
        dryRun: true,
        webhookConfigured: Boolean(process.env.DISCORD_WEBHOOK_URL),
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
