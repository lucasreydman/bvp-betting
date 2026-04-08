import { fmtOdds } from './odds'
import type { MatchupResult, MatchupsResponse } from './types'
import { matchupKey, selectTopPlays, suggestRecommendedDoubles, teamAbbr } from './utils'

const DISCORD_SENT_TTL_SECONDS = 259200

export interface DiscordNotificationEvent {
  id: string
  content: string
}

function getTrackedTopPlays(results: MatchupResult[]): MatchupResult[] {
  return selectTopPlays(results.filter(matchup => matchup.recommendationTags?.includes('T4')))
}

function getDoubleLabel(isSmash: boolean, index: number, total: number): string {
  if (isSmash) return 'Smash Double'
  if (total === 1) return 'Daily Double'
  return index === 0 ? 'Daily Double' : 'Secondary Double'
}

function formatLeg(matchup: MatchupResult): string {
  const odds = matchup.consensusHitOddsAmerican == null ? 'odds N/A' : fmtOdds(matchup.consensusHitOddsAmerican)
  return `${matchup.batterName} (${teamAbbr(matchup.batterTeam)}) vs ${matchup.pitcherName} ${odds}`
}

function buildTop4LockEvent(response: MatchupsResponse, topPlays: MatchupResult[]): DiscordNotificationEvent | null {
  if (!response.slateLockedAt || topPlays.length === 0) return null

  const lines = topPlays.map((matchup, index) => `${index + 1}. ${formatLeg(matchup)}`)
  return {
    id: `top4-lock:${response.date}:${response.slateLockedAt}`,
    content: [`Top 4 locked for ${response.date}.`, ...lines].join('\n'),
  }
}

function buildDoubleLockEvents(response: MatchupsResponse, topPlays: MatchupResult[]): DiscordNotificationEvent[] {
  if (!response.slateLockedAt || topPlays.length < 2) return []

  const recommendedDoubles = suggestRecommendedDoubles(topPlays)
  return recommendedDoubles.map((double, index) => {
    const label = getDoubleLabel(double.isSmash, index, recommendedDoubles.length)
    const parlayOdds = double.consensusParlayOddsAmerican == null ? 'Parlay odds N/A' : `Parlay ${fmtOdds(double.consensusParlayOddsAmerican)}`
    const legsKey = [matchupKey(double.first), matchupKey(double.second)].sort().join(':')

    return {
      id: `double-lock:${response.date}:${label}:${legsKey}`,
      content: [
        `${label} locked for ${response.date}.`,
        `Leg 1: ${formatLeg(double.first)}`,
        `Leg 2: ${formatLeg(double.second)}`,
        parlayOdds,
      ].join('\n'),
    }
  })
}

function buildLegHitEvents(response: MatchupsResponse, results: MatchupResult[]): DiscordNotificationEvent[] {
  return results
    .filter(matchup => matchup.hitResult === 'win')
    .map(matchup => ({
      id: `leg-hit:${response.date}:${matchupKey(matchup)}`,
      content: `Hit: ${matchup.batterName} recorded a hit vs ${matchup.pitcherName}.`,
    }))
}

function buildDoubleHitEvents(response: MatchupsResponse, topPlays: MatchupResult[]): DiscordNotificationEvent[] {
  const resultsByKey = new Map(topPlays.map(matchup => [matchupKey(matchup), matchup]))
  const recommendedDoubles = suggestRecommendedDoubles(topPlays)

  return recommendedDoubles.flatMap((double, index) => {
    const first = resultsByKey.get(matchupKey(double.first))
    const second = resultsByKey.get(matchupKey(double.second))

    if (first?.hitResult !== 'win' || second?.hitResult !== 'win') {
      return []
    }

    const label = getDoubleLabel(double.isSmash, index, recommendedDoubles.length)
    const parlayOdds = double.consensusParlayOddsAmerican == null ? 'Parlay odds N/A' : `Parlay ${fmtOdds(double.consensusParlayOddsAmerican)}`
    const legsKey = [matchupKey(double.first), matchupKey(double.second)].sort().join(':')

    return [{
      id: `double-hit:${response.date}:${label}:${legsKey}`,
      content: `${label} hit: ${first.batterName} and ${second.batterName} both recorded a hit. ${parlayOdds}.`,
    }]
  })
}

export function buildDiscordNotificationEvents(response: MatchupsResponse): DiscordNotificationEvent[] {
  const topPlays = getTrackedTopPlays(response.results)

  return [
    buildTop4LockEvent(response, topPlays),
    ...buildDoubleLockEvents(response, topPlays),
    ...buildLegHitEvents(response, response.results),
    ...buildDoubleHitEvents(response, response.results.filter(matchup => matchup.recommendationTags?.includes('T4'))),
  ].filter((event): event is DiscordNotificationEvent => event !== null)
}

export function getDiscordSentKey(date: string): string {
  return `discord-notify-sent:${date}`
}

export function getDiscordSentTtlSeconds(): number {
  return DISCORD_SENT_TTL_SECONDS
}
