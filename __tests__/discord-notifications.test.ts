import { buildDiscordNotificationEvents } from '@/lib/discord-notifications'
import type { MatchupResult, MatchupsResponse } from '@/lib/types'

const makeMatchup = (overrides: Partial<MatchupResult> = {}): MatchupResult => ({
  batterId: 1,
  batterName: 'Test Batter',
  batterTeam: 'New York Yankees',
  batterTeamId: 147,
  pitcherId: 2,
  pitcherName: 'Test Pitcher',
  pitcherTeam: 'Boston Red Sox',
  gamePk: 123456,
  gameTime: '2026-04-08T23:05:00Z',
  isHome: true,
  lineupSource: 'confirmed',
  lineupPosition: 2,
  ab: 20,
  h: 8,
  doubles: 2,
  triples: 0,
  hr: 2,
  bb: 3,
  hbp: 0,
  sf: 0,
  k: 4,
  rbi: 5,
  avg: 0.4,
  slg: 0.7,
  obp: 0.478,
  ops: 1.05,
  xbh: 4,
  confidence: 'high',
  gameStatus: 'upcoming',
  consensusHitOddsAmerican: -120,
  recommendationTags: ['T4'],
  ...overrides,
})

const makeResponse = (results: MatchupResult[], slateLockedAt: string | null = '2026-04-08T17:05:00.000Z'): MatchupsResponse => ({
  date: '2026-04-08',
  fetchedAt: '2026-04-08T17:06:00.000Z',
  slateLockedAt,
  gamesScanned: 10,
  gamesSkipped: 0,
  matchupsFound: results.length,
  results,
})

describe('buildDiscordNotificationEvents', () => {
  it('builds top-4 and double lock events once the slate is locked', () => {
    const results = [
      makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', consensusHitOddsAmerican: -135 }),
      makeMatchup({ batterId: 2, pitcherId: 22, batterName: 'Mookie Betts', consensusHitOddsAmerican: -125 }),
      makeMatchup({ batterId: 3, pitcherId: 33, batterName: 'Freddie Freeman', consensusHitOddsAmerican: -110, ops: 0.91, h: 6 }),
      makeMatchup({ batterId: 4, pitcherId: 44, batterName: 'Rafael Devers', consensusHitOddsAmerican: 105, ops: 0.9, h: 5 }),
    ]

    const events = buildDiscordNotificationEvents(makeResponse(results))

    expect(events.some(event => event.id.startsWith('top4-lock:2026-04-08'))).toBe(true)
    expect(events.some(event => event.id.startsWith('double-lock:2026-04-08:Smash Double'))).toBe(true)
    expect(events.some(event => event.id.startsWith('double-lock:2026-04-08:Secondary Double'))).toBe(true)
  })

  it('builds leg-hit and double-hit events for winning tracked plays', () => {
    const winnerA = makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', hitResult: 'win', gameStatus: 'inProgress' })
    const winnerB = makeMatchup({ batterId: 2, pitcherId: 22, batterName: 'Mookie Betts', hitResult: 'win', gameStatus: 'inProgress' })
    const pendingC = makeMatchup({ batterId: 3, pitcherId: 33, batterName: 'Freddie Freeman', hitResult: 'pending', gameStatus: 'inProgress', ops: 0.91, h: 6 })
    const pendingD = makeMatchup({ batterId: 4, pitcherId: 44, batterName: 'Rafael Devers', hitResult: 'pending', gameStatus: 'inProgress', ops: 0.9, h: 5 })

    const events = buildDiscordNotificationEvents(makeResponse([winnerA, winnerB, pendingC, pendingD]))

    expect(events.some(event => event.id === `leg-hit:2026-04-08:${winnerA.gamePk}:${winnerA.batterId}:${winnerA.pitcherId}`)).toBe(true)
    expect(events.some(event => event.id === `leg-hit:2026-04-08:${winnerB.gamePk}:${winnerB.batterId}:${winnerB.pitcherId}`)).toBe(true)
    expect(events.some(event => event.id.startsWith('double-hit:2026-04-08:Smash Double'))).toBe(true)
  })

  it('does not emit lock events before the slate lock', () => {
    const events = buildDiscordNotificationEvents(makeResponse([
      makeMatchup({ batterId: 1, pitcherId: 11 }),
      makeMatchup({ batterId: 2, pitcherId: 22 }),
    ], null))

    expect(events.some(event => event.id.startsWith('top4-lock:'))).toBe(false)
    expect(events.some(event => event.id.startsWith('double-lock:'))).toBe(false)
  })
})
