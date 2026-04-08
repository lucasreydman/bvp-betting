import {
  buildDiscordNotificationEvents,
  buildDiscordTopPlaysSnapshot,
  getNotificationLeadMinutes,
  shouldLockDiscordSnapshot,
} from '@/lib/discord-notifications'
import type { DiscordTopPlaysSnapshot, MatchupResult, MatchupsResponse } from '@/lib/types'

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
  earliestGameTime: '2026-04-08T18:05:00.000Z',
  gamesScanned: 10,
  gamesSkipped: 0,
  matchupsFound: results.length,
  debug: {
    lockState: slateLockedAt ? 'locked' : 'preLock',
    trackedCount: results.length,
    qualifyingUpcomingCount: results.length,
    confirmedQualifyingUpcomingCount: results.filter(matchup => matchup.lineupSource === 'confirmed').length,
    estimatedQualifyingUpcomingCount: results.filter(matchup => matchup.lineupSource === 'estimated').length,
    confirmedSlatePoolCount: results.filter(matchup => matchup.lineupSource === 'confirmed').length,
    gamesWithProbablePitchers: 10,
    gamesSkippedMissingProbable: 0,
    explanation: 'Test debug summary.',
  },
  confirmedTopPlaysPreview: results.filter(matchup => matchup.lineupSource === 'confirmed').slice(0, 4),
  results,
})

const makeSnapshot = (topPlays: MatchupResult[], leadMinutes = 25): DiscordTopPlaysSnapshot => ({
  date: '2026-04-08',
  lockedAt: '2026-04-08T17:40:00.000Z',
  leadMinutes,
  topPlays,
})

describe('buildDiscordNotificationEvents', () => {
  it('builds top-4 and double lock events from the Discord snapshot', () => {
    const topPlays = [
      makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', consensusHitOddsAmerican: -135 }),
      makeMatchup({ batterId: 2, pitcherId: 22, batterName: 'Mookie Betts', consensusHitOddsAmerican: -125 }),
      makeMatchup({ batterId: 3, pitcherId: 33, batterName: 'Freddie Freeman', consensusHitOddsAmerican: -110, ops: 0.91, h: 6 }),
      makeMatchup({ batterId: 4, pitcherId: 44, batterName: 'Rafael Devers', consensusHitOddsAmerican: 105, ops: 0.9, h: 5 }),
    ]

    const events = buildDiscordNotificationEvents({
      date: '2026-04-08',
      snapshot: makeSnapshot(topPlays),
      results: topPlays,
    })

    expect(events.some(event => event.id.startsWith('top4-lock:2026-04-08'))).toBe(true)
    expect(events.some(event => event.id.includes(':Smash Double:'))).toBe(true)
    expect(events.some(event => event.id.includes(':Secondary Double:'))).toBe(true)
  })

  it('builds leg-hit and double-hit events for winning tracked plays', () => {
    const winnerA = makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', hitResult: 'win', gameStatus: 'inProgress' })
    const winnerB = makeMatchup({ batterId: 2, pitcherId: 22, batterName: 'Mookie Betts', hitResult: 'win', gameStatus: 'inProgress' })
    const pendingC = makeMatchup({ batterId: 3, pitcherId: 33, batterName: 'Freddie Freeman', hitResult: 'pending', gameStatus: 'inProgress', ops: 0.91, h: 6 })
    const pendingD = makeMatchup({ batterId: 4, pitcherId: 44, batterName: 'Rafael Devers', hitResult: 'pending', gameStatus: 'inProgress', ops: 0.9, h: 5 })

    const events = buildDiscordNotificationEvents({
      date: '2026-04-08',
      snapshot: makeSnapshot([winnerA, winnerB, pendingC, pendingD]),
      results: [winnerA, winnerB, pendingC, pendingD],
    })

    expect(events.some(event => event.id === `leg-hit:2026-04-08:${winnerA.gamePk}:${winnerA.batterId}:${winnerA.pitcherId}`)).toBe(true)
    expect(events.some(event => event.id === `leg-hit:2026-04-08:${winnerB.gamePk}:${winnerB.batterId}:${winnerB.pitcherId}`)).toBe(true)
    expect(events.some(event => event.id.startsWith('double-hit:2026-04-08:Smash Double'))).toBe(true)
  })

  it('uses only snapshot rows for hit events even when extra rows are present', () => {
    const tracked = makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', hitResult: 'win', gameStatus: 'inProgress' })
    const extra = makeMatchup({ batterId: 99, pitcherId: 88, batterName: 'Extra Batter', hitResult: 'win', gameStatus: 'inProgress' })

    const events = buildDiscordNotificationEvents({
      date: '2026-04-08',
      snapshot: makeSnapshot([tracked]),
      results: [tracked, extra],
    })

    expect(events.some(event => event.content.includes('Juan Soto'))).toBe(true)
    expect(events.some(event => event.content.includes('Extra Batter'))).toBe(false)
  })

  it('omits missing odds text from lock and hit messages', () => {
    const topPlayA = makeMatchup({ batterId: 1, pitcherId: 11, batterName: 'Juan Soto', consensusHitOddsAmerican: null, hitResult: 'win', gameStatus: 'inProgress' })
    const topPlayB = makeMatchup({ batterId: 2, pitcherId: 22, batterName: 'Mookie Betts', consensusHitOddsAmerican: null, hitResult: 'win', gameStatus: 'inProgress' })

    const events = buildDiscordNotificationEvents({
      date: '2026-04-08',
      snapshot: makeSnapshot([topPlayA, topPlayB]),
      results: [topPlayA, topPlayB],
    })

    expect(events.every(event => !event.content.includes('N/A'))).toBe(true)
    expect(events.every(event => !event.content.includes('Parlay odds'))).toBe(true)
  })
})

describe('Discord snapshot cutoff', () => {
  it('locks once the configured lead time before first pitch is reached', () => {
    expect(shouldLockDiscordSnapshot('2026-04-08T18:05:00.000Z', new Date('2026-04-08T17:04:59.000Z').getTime(), 60)).toBe(false)
    expect(shouldLockDiscordSnapshot('2026-04-08T18:05:00.000Z', new Date('2026-04-08T17:05:00.000Z').getTime(), 60)).toBe(true)
  })

  it('builds the Discord snapshot from confirmed preview rows only', () => {
    const confirmed = makeMatchup({ batterId: 1, pitcherId: 11, lineupSource: 'confirmed' })
    const estimated = makeMatchup({ batterId: 2, pitcherId: 22, lineupSource: 'estimated' })
    const response = makeResponse([confirmed, estimated])
    response.confirmedTopPlaysPreview = [confirmed]

    expect(buildDiscordTopPlaysSnapshot(response, '2026-04-08T17:05:00.000Z', 60)).toEqual({
      ...makeSnapshot([confirmed], 60),
      lockedAt: '2026-04-08T17:05:00.000Z',
    })
  })

  it('defaults the lead time to 60 minutes when env input is invalid', () => {
    expect(getNotificationLeadMinutes('abc')).toBe(60)
    expect(getNotificationLeadMinutes('-5')).toBe(60)
  })
})
