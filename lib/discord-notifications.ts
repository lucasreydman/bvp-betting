import type { DiscordTopPlaysSnapshot, MatchupResult, MatchupsResponse } from './types'
import { fillOpenTopPlaySlots, matchupKey, selectTopPlays, suggestRecommendedDoubles, teamAbbr } from './utils'

const DISCORD_SENT_TTL_SECONDS = 259200
const DISCORD_SNAPSHOT_TTL_SECONDS = 259200
const DEFAULT_NOTIFICATION_LEAD_MINUTES = 60

export interface DiscordNotificationEvent {
  id: string
  content: string
}

export interface DiscordWebhookPayload {
  content: string
  allowed_mentions: {
    parse: string[]
  }
}

export interface DiscordNotificationSource {
  date: string
  snapshot: DiscordTopPlaysSnapshot
  results: MatchupResult[]
  addedTopPlays?: MatchupResult[]
}

function getDoubleLabel(isSmash: boolean, index: number, total: number): string {
  if (isSmash) return 'Smash Double'
  if (total === 1) return 'Daily Double'
  return index === 0 ? 'Daily Double' : 'Secondary Double'
}

function formatLeg(matchup: MatchupResult): string {
  return `${matchup.batterName} (${teamAbbr(matchup.batterTeam)}) vs ${matchup.pitcherName}`
}

export function buildDiscordWebhookPayload(content: string): DiscordWebhookPayload {
  const normalizedContent = content.trimStart().startsWith('@everyone')
    ? content
    : `@everyone\n${content}`

  return {
    content: normalizedContent,
    allowed_mentions: {
      parse: ['everyone'],
    },
  }
}

export function getDiscordSnapshotKey(date: string): string {
  return `discord-top4:${date}`
}

export function getDiscordSnapshotTtlSeconds(): number {
  return DISCORD_SNAPSHOT_TTL_SECONDS
}

export function getNotificationLeadMinutes(rawValue = process.env.DISCORD_NOTIFICATION_LEAD_MINUTES): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_NOTIFICATION_LEAD_MINUTES
  return Math.floor(parsed)
}

export function shouldLockDiscordSnapshot(
  earliestGameTime: string | null,
  nowMs: number,
  leadMinutes: number,
): boolean {
  if (!earliestGameTime) return false

  const firstPitchMs = new Date(earliestGameTime).getTime()
  if (Number.isNaN(firstPitchMs)) return false

  return nowMs >= firstPitchMs - leadMinutes * 60_000
}

export function buildDiscordTopPlaysSnapshot(
  response: MatchupsResponse,
  lockedAt: string,
  leadMinutes: number,
): DiscordTopPlaysSnapshot | null {
  const topPlays = selectTopPlays(response.confirmedTopPlaysPreview ?? [])
  if (topPlays.length === 0) return null

  return {
    date: response.date,
    lockedAt,
    leadMinutes,
    topPlays,
  }
}

export function extendDiscordTopPlaysSnapshot(
  snapshot: DiscordTopPlaysSnapshot,
  response: MatchupsResponse,
): { snapshot: DiscordTopPlaysSnapshot; addedTopPlays: MatchupResult[] } {
  const filledTopPlays = fillOpenTopPlaySlots(snapshot.topPlays, response.confirmedTopPlaysPreview ?? [])
  const existingKeys = new Set(snapshot.topPlays.map(matchup => matchupKey(matchup)))
  const addedTopPlays = filledTopPlays.filter(matchup => !existingKeys.has(matchupKey(matchup)))

  if (addedTopPlays.length === 0) {
    return { snapshot, addedTopPlays }
  }

  return {
    snapshot: {
      ...snapshot,
      topPlays: filledTopPlays,
    },
    addedTopPlays,
  }
}

function buildTop4LockEvent(snapshot: DiscordTopPlaysSnapshot): DiscordNotificationEvent | null {
  if (snapshot.topPlays.length === 0) return null

  const lines = snapshot.topPlays.map((matchup, index) => `${index + 1}. ${formatLeg(matchup)}`)
  return {
    id: `top4-lock:${snapshot.date}:${snapshot.lockedAt}`,
    content: [`Top 4 alert board locked for ${snapshot.date} (${snapshot.leadMinutes}m before first pitch).`, ...lines].join('\n'),
  }
}

function buildTop4FillEvents(snapshot: DiscordTopPlaysSnapshot, addedTopPlays: MatchupResult[]): DiscordNotificationEvent[] {
  return addedTopPlays.map(matchup => ({
    id: `top4-fill:${snapshot.date}:${snapshot.lockedAt}:${matchupKey(matchup)}`,
    content: `Top 4 alert board added after lock for ${snapshot.date}: ${formatLeg(matchup)}.`,
  }))
}

function buildDoubleLockEvents(snapshot: DiscordTopPlaysSnapshot): DiscordNotificationEvent[] {
  if (snapshot.topPlays.length < 2) return []

  const recommendedDoubles = suggestRecommendedDoubles(snapshot.topPlays)
  return recommendedDoubles.map((double, index) => {
    const label = getDoubleLabel(double.isSmash, index, recommendedDoubles.length)
    const legsKey = [matchupKey(double.first), matchupKey(double.second)].sort().join(':')

    return {
      id: `double-lock:${snapshot.date}:${snapshot.lockedAt}:${label}:${legsKey}`,
      content: [
        `${label} locked for ${snapshot.date} (${snapshot.leadMinutes}m before first pitch).`,
        `Leg 1: ${formatLeg(double.first)}`,
        `Leg 2: ${formatLeg(double.second)}`,
      ].join('\n'),
    }
  })
}

function buildLegHitEvents(date: string, results: MatchupResult[]): DiscordNotificationEvent[] {
  return results
    .filter(matchup => matchup.hitResult === 'win')
    .map(matchup => ({
      id: `leg-hit:${date}:${matchupKey(matchup)}`,
      content: `Hit: ${matchup.batterName} recorded a hit vs ${matchup.pitcherName}.`,
    }))
}

function buildDoubleHitEvents(snapshot: DiscordTopPlaysSnapshot, topPlays: MatchupResult[]): DiscordNotificationEvent[] {
  const resultsByKey = new Map(topPlays.map(matchup => [matchupKey(matchup), matchup]))
  const recommendedDoubles = suggestRecommendedDoubles(snapshot.topPlays)

  return recommendedDoubles.flatMap((double, index) => {
    const first = resultsByKey.get(matchupKey(double.first))
    const second = resultsByKey.get(matchupKey(double.second))

    if (first?.hitResult !== 'win' || second?.hitResult !== 'win') {
      return []
    }

    const label = getDoubleLabel(double.isSmash, index, recommendedDoubles.length)
    const legsKey = [matchupKey(double.first), matchupKey(double.second)].sort().join(':')

    return [{
      id: `double-hit:${snapshot.date}:${label}:${legsKey}`,
      content: `${label} hit: ${first.batterName} and ${second.batterName} both recorded a hit.`,
    }]
  })
}

function buildDaySummaryEvent(snapshot: DiscordTopPlaysSnapshot, topPlays: MatchupResult[]): DiscordNotificationEvent | null {
  if (topPlays.length === 0 || topPlays.some(matchup => matchup.gameStatus !== 'settled')) {
    return null
  }

  const playWins = topPlays.filter(matchup => matchup.hitResult === 'win').length
  const recommendedDoubles = suggestRecommendedDoubles(snapshot.topPlays)
  const doubleWins = recommendedDoubles.filter(double => {
    const first = topPlays.find(matchup => matchupKey(matchup) === matchupKey(double.first))
    const second = topPlays.find(matchup => matchupKey(matchup) === matchupKey(double.second))
    return first?.hitResult === 'win' && second?.hitResult === 'win'
  }).length

  const lines = [
    `Day summary for ${snapshot.date}: ${playWins}/${topPlays.length} plays hit.`,
    `Recommended doubles: ${doubleWins}/${recommendedDoubles.length} hit.`,
  ]

  return {
    id: `day-summary:${snapshot.date}:${snapshot.lockedAt}`,
    content: lines.join('\n'),
  }
}

export function buildDiscordNotificationEvents(source: DiscordNotificationSource): DiscordNotificationEvent[] {
  const trackedResults = source.results.filter(matchup => source.snapshot.topPlays.some(topPlay => matchupKey(topPlay) === matchupKey(matchup)))

  return [
    buildTop4LockEvent(source.snapshot),
    ...buildTop4FillEvents(source.snapshot, source.addedTopPlays ?? []),
    ...buildDoubleLockEvents(source.snapshot),
    ...buildLegHitEvents(source.date, trackedResults),
    ...buildDoubleHitEvents(source.snapshot, trackedResults),
    buildDaySummaryEvent(source.snapshot, trackedResults),
  ].filter((event): event is DiscordNotificationEvent => event !== null)
}

export function getDiscordSentKey(date: string): string {
  return `discord-notify-sent:${date}`
}

export function getDiscordSentTtlSeconds(): number {
  return DISCORD_SENT_TTL_SECONDS
}
