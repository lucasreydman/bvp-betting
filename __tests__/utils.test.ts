import { buildMatchupsDebugInfo, buildRecommendationTags, fillOpenTopPlaySlots, formatTime, formatLocalDate, formatSlateDate, formatCountdownToStart, generateCSV, applyFilters, sortMatchups, regressedAvg, expectedAtBats, getEarliestGameTimeMs, hitProbability, isSlateLockReached, selectTopPlays, suggestDailyDouble, suggestRecommendedDoubles, generateRecommendedDoublesCSV, resolveLineupPosition, medianLineupPosition } from '@/lib/utils'
import { DEFAULT_FILTERS, type MatchupResult } from '@/lib/types'

const makeMatchup = (overrides: Partial<MatchupResult> = {}): MatchupResult => ({
  batterId: 1,
  batterName: 'Test Batter',
  batterTeam: 'NYY',
  batterTeamId: 147,
  pitcherId: 2,
  pitcherName: 'Test Pitcher',
  pitcherTeam: 'BOS',
  gamePk: 123456,
  gameTime: '2026-04-01T18:05:00Z',
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
  avg: 0.400,
  slg: 0.700,
  obp: 0.478,
  ops: 1.178,
  xbh: 4,
  confidence: 'medium',
  gameStatus: 'upcoming',
  ...overrides,
})

describe('formatTime', () => {
  it('formats ISO string in the runtime local timezone', () => {
    const result = formatTime('2026-04-01T18:05:00Z')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
    expect(result).toMatch(/AM|PM/)
  })
})

describe('formatLocalDate', () => {
  it('uses local calendar fields instead of UTC ISO date slicing', () => {
    const date = new Date('2026-04-04T01:30:00Z')
    const getFullYearSpy = jest.spyOn(date, 'getFullYear').mockReturnValue(2026)
    const getMonthSpy = jest.spyOn(date, 'getMonth').mockReturnValue(3)
    const getDateSpy = jest.spyOn(date, 'getDate').mockReturnValue(3)
    const toISOStringSpy = jest.spyOn(date, 'toISOString').mockReturnValue('2026-04-04T01:30:00.000Z')

    expect(formatLocalDate(date)).toBe('2026-04-03')
    expect(toISOStringSpy).not.toHaveBeenCalled()

    getFullYearSpy.mockRestore()
    getMonthSpy.mockRestore()
    getDateSpy.mockRestore()
    toISOStringSpy.mockRestore()
  })
})

describe('formatSlateDate', () => {
  it('uses the Pacific calendar day for the active slate', () => {
    const date = new Date('2026-04-08T03:08:00Z')

    expect(formatSlateDate(date)).toBe('2026-04-07')
  })
})

describe('slate lock timing', () => {
  it('finds the earliest valid game time on the slate', () => {
    expect(getEarliestGameTimeMs([
      '2026-04-08T23:10:00Z',
      'invalid',
      '2026-04-08T17:05:00Z',
      '2026-04-08T20:40:00Z',
    ])).toBe(new Date('2026-04-08T17:05:00Z').getTime())
  })

  it('locks the official Top 4 once the first scheduled pitch is reached', () => {
    const gameTimes = ['2026-04-08T17:05:00Z', '2026-04-08T20:40:00Z']

    expect(isSlateLockReached(gameTimes, new Date('2026-04-08T17:04:59Z').getTime())).toBe(false)
    expect(isSlateLockReached(gameTimes, new Date('2026-04-08T17:05:00Z').getTime())).toBe(true)
  })
})

describe('buildMatchupsDebugInfo', () => {
  it('explains thin pre-lock boards and confirms they can refill', () => {
    const debug = buildMatchupsDebugInfo({
      slateLockedAt: null,
      trackedCount: 3,
      qualifyingUpcomingCount: 3,
      confirmedQualifyingUpcomingCount: 3,
      estimatedQualifyingUpcomingCount: 0,
      confirmedSlatePoolCount: 3,
      gamesWithProbablePitchers: 5,
      gamesSkippedMissingProbable: 1,
    })

    expect(debug.lockState).toBe('preLock')
    expect(debug.explanation).toContain('Showing 3 current candidates')
    expect(debug.explanation).toContain('Another qualifying play can still move in before first pitch')
    expect(debug.explanation).toContain('Missing probable pitchers are also shrinking the candidate pool')
    expect(debug.explanation).toContain('1 game was skipped for missing probable pitchers')
  })

  it('explains locked boards with fewer than four confirmed plays', () => {
    const debug = buildMatchupsDebugInfo({
      slateLockedAt: '2026-04-08T17:05:00.000Z',
      trackedCount: 3,
      qualifyingUpcomingCount: 0,
      confirmedQualifyingUpcomingCount: 0,
      estimatedQualifyingUpcomingCount: 1,
      confirmedSlatePoolCount: 3,
      gamesWithProbablePitchers: 6,
      gamesSkippedMissingProbable: 0,
    })

    expect(debug.lockState).toBe('locked')
    expect(debug.explanation).toContain('locked at first pitch with 3 plays')
    expect(debug.explanation).toContain('Only 3 confirmed qualifiers were available at lock time')
    expect(debug.explanation).toContain('Open slots can still fill as later lineups confirm')
  })

  it('explains empty pre-lock boards when nothing qualifies yet', () => {
    const debug = buildMatchupsDebugInfo({
      slateLockedAt: null,
      trackedCount: 0,
      qualifyingUpcomingCount: 0,
      confirmedQualifyingUpcomingCount: 0,
      estimatedQualifyingUpcomingCount: 0,
      confirmedSlatePoolCount: 0,
      gamesWithProbablePitchers: 5,
      gamesSkippedMissingProbable: 1,
    })

    expect(debug.explanation).toContain('No qualifying upcoming plays yet')
    expect(debug.explanation).toContain('5 games currently have probable pitchers')
  })

  it('explains when no games are usable yet because probable pitchers are missing', () => {
    const debug = buildMatchupsDebugInfo({
      slateLockedAt: null,
      trackedCount: 0,
      qualifyingUpcomingCount: 0,
      confirmedQualifyingUpcomingCount: 0,
      estimatedQualifyingUpcomingCount: 0,
      confirmedSlatePoolCount: 0,
      gamesWithProbablePitchers: 0,
      gamesSkippedMissingProbable: 4,
    })

    expect(debug.explanation).toContain('No games are usable yet because probable pitchers have not been posted')
    expect(debug.explanation).toContain('4 games were skipped for missing probable pitchers')
  })
})

describe('fillOpenTopPlaySlots', () => {
  it('preserves locked plays and fills remaining slots with the best new candidates', () => {
    const lockedA = makeMatchup({ batterId: 1, pitcherId: 11, avg: 0.41, ab: 35 })
    const lockedB = makeMatchup({ batterId: 2, pitcherId: 22, avg: 0.4, ab: 32 })
    const newTop = makeMatchup({ batterId: 3, pitcherId: 33, avg: 0.39, ab: 31 })
    const newSecond = makeMatchup({ batterId: 4, pitcherId: 44, avg: 0.38, ab: 30 })
    const ignored = makeMatchup({ batterId: 5, pitcherId: 55, avg: 0.31, ab: 18 })

    const filled = fillOpenTopPlaySlots([lockedA, lockedB], [lockedA, newTop, newSecond, ignored])

    expect(filled).toHaveLength(4)
    expect(filled.map(matchup => matchup.batterId).sort()).toEqual([1, 2, 3, 4])
  })
})

describe('applyFilters', () => {
  it('returns all matchups when no optional filters are active', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.400, ops: 1.178 })
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
  })

  it('excludes matchup below minOPS when OPS filter is active', () => {
    const matchup = makeMatchup({ ops: 0.650 })
    const result = applyFilters([matchup], { minOPS: 0.700, minH: null })
    expect(result).toHaveLength(0)
  })

  it('excludes matchup below minH when hits filter is active', () => {
    const matchup = makeMatchup({ h: 5 })
    const result = applyFilters([matchup], { minOPS: null, minH: 7 })
    expect(result).toHaveLength(0)
  })

  it('applies OPS and hits filters together (AND logic)', () => {
    const passing = makeMatchup({ ops: 0.800, h: 8 })
    const failsOps = makeMatchup({ ops: 0.650, h: 8 })
    const failsH = makeMatchup({ ops: 0.800, h: 5 })
    const result = applyFilters([passing, failsOps, failsH], { minOPS: 0.700, minH: 7 })
    expect(result).toHaveLength(1)
    expect(result[0].ops).toBe(0.800)
  })
})

describe('sortMatchups', () => {
  it('sorts by SLG descending by default', () => {
    const a = makeMatchup({ slg: 0.500 })
    const b = makeMatchup({ slg: 0.900 })
    const result = sortMatchups([a, b], { column: 'slg', direction: 'desc' })
    expect(result[0].slg).toBe(0.900)
  })

  it('sorts ascending when specified', () => {
    const a = makeMatchup({ slg: 0.900 })
    const b = makeMatchup({ slg: 0.500 })
    const result = sortMatchups([a, b], { column: 'slg', direction: 'asc' })
    expect(result[0].slg).toBe(0.500)
  })
})

describe('regressedAvg', () => {
  it('moves small samples toward league average', () => {
    expect(regressedAvg(0.400, 15)).toBeGreaterThan(0.320)
    expect(regressedAvg(0.400, 15)).toBeLessThan(0.400)
  })

  it('returns conditional mean for zero AB', () => {
    expect(regressedAvg(0.500, 0)).toBe(0.320)
  })
})

describe('expectedAtBats', () => {
  it('estimates more ABs for top lineup spots', () => {
    expect(expectedAtBats(2)).toBeGreaterThan(expectedAtBats(6))
    expect(expectedAtBats(8)).toBeLessThan(expectedAtBats(4))
  })

  it('falls back to a default estimate when lineup position is missing', () => {
    expect(expectedAtBats(undefined)).toBe(4.1)
  })
})

describe('resolveLineupPosition', () => {
  it('prefers confirmed lineupPosition when present', () => {
    expect(resolveLineupPosition({ lineupPosition: 2, predictedLineupPosition: 5 })).toBe(2)
  })

  it('falls back to predicted lineup position for estimated rows', () => {
    expect(resolveLineupPosition({ lineupPosition: undefined, predictedLineupPosition: 5 })).toBe(5)
  })
})

describe('medianLineupPosition', () => {
  it('returns the median slot for odd-length samples', () => {
    expect(medianLineupPosition([1, 4, 2, 2, 3])).toBe(2)
  })

  it('rounds the middle pair for even-length samples', () => {
    expect(medianLineupPosition([2, 3, 4, 5])).toBe(4)
  })

  it('returns undefined for empty samples', () => {
    expect(medianLineupPosition([])).toBeUndefined()
  })
})

describe('hitProbability', () => {
  it('computes probability of at least one hit in multiple AB', () => {
    expect(hitProbability(0.4, 4)).toBeCloseTo(0.8704)
  })
})

describe('selectTopPlays', () => {
  it('caps the official set at four plays using weighted avg, avg, and AB tiebreakers', () => {
    const first = makeMatchup({ batterId: 1, pitcherId: 11, avg: 0.410, ab: 40 })
    const second = makeMatchup({ batterId: 2, pitcherId: 22, avg: 0.405, ab: 36 })
    const third = makeMatchup({ batterId: 3, pitcherId: 33, avg: 0.390, ab: 34 })
    const fourth = makeMatchup({ batterId: 4, pitcherId: 44, avg: 0.380, ab: 32 })
    const fifth = makeMatchup({ batterId: 5, pitcherId: 55, avg: 0.380, ab: 28 })

    expect(selectTopPlays([fifth, third, first, fourth, second])).toEqual([first, second, third, fourth])
  })
})

describe('suggestRecommendedDoubles', () => {
  it('returns the single best pair by combined probability when fewer than four plays qualify', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.300, ab: 40 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.320, ab: 30 })
    const c = makeMatchup({ batterId: 3, pitcherId: 3, avg: 0.350, ab: 20 })
    const result = suggestRecommendedDoubles([a, b, c])

    expect(result).toHaveLength(1)
    expect(result[0].first.batterId).not.toBe(result[0].second.batterId)
    expect(result[0].combinedProbability).toBeGreaterThan(0)
  })

  it('returns two doubles when four plays qualify', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.340, ab: 40 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.335, ab: 36 })
    const c = makeMatchup({ batterId: 3, pitcherId: 3, avg: 0.330, ab: 34 })
    const d = makeMatchup({ batterId: 4, pitcherId: 4, avg: 0.325, ab: 32 })
    const result = suggestRecommendedDoubles([a, b, c, d])

    expect(result).toHaveLength(2)
    const ids = result.flatMap(double => [double.first.batterId, double.second.batterId]).sort()
    expect(ids).toEqual([1, 2, 3, 4])
  })

  it('forces a smash double into the first slot when one exists', () => {
    const smashA = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.310, ab: 18, ops: 0.980, h: 8 })
    const smashB = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.305, ab: 18, ops: 0.970, h: 7 })
    const betterC = makeMatchup({ batterId: 3, pitcherId: 3, avg: 0.420, ab: 45, ops: 0.910, h: 10 })
    const betterD = makeMatchup({ batterId: 4, pitcherId: 4, avg: 0.410, ab: 42, ops: 0.900, h: 9 })
    const result = suggestRecommendedDoubles([smashA, smashB, betterC, betterD])

    expect(result).toHaveLength(2)
    expect(result[0].isSmash).toBe(true)
    expect([result[0].first.batterId, result[0].second.batterId].sort()).toEqual([1, 2])
    expect([result[1].first.batterId, result[1].second.batterId].sort()).toEqual([3, 4])
  })

  it('marks isSmash when both legs have OPS > 0.950 and H >= 7', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.380, ab: 35, ops: 0.980, h: 13 })
    const result = suggestRecommendedDoubles([a, b])

    expect(result).toHaveLength(1)
    expect(result[0].isSmash).toBe(true)
  })

  it('does not mark isSmash when one leg is below 0.950 OPS', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.380, ab: 35, ops: 0.900, h: 13 })
    const result = suggestRecommendedDoubles([a, b])

    expect(result).toHaveLength(1)
    expect(result[0].isSmash).toBe(false)
  })

  it('does not mark isSmash when one leg has fewer than 7 hits', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.333, ab: 15, ops: 0.980, h: 5 })
    const result = suggestRecommendedDoubles([a, b])

    expect(result).toHaveLength(1)
    expect(result[0].isSmash).toBe(false)
  })

  it('returns no doubles when no valid pairs exist', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.300, ab: 40 })
    expect(suggestRecommendedDoubles([a])).toEqual([])
  })

  it('uses predicted lineup position when confirmed order is unavailable', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, lineupSource: 'estimated', lineupPosition: undefined, predictedLineupPosition: 2, avg: 0.300, ab: 30 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, lineupSource: 'estimated', lineupPosition: undefined, predictedLineupPosition: 8, avg: 0.300, ab: 30 })
    const result = suggestDailyDouble([a, b])

    expect(result).not.toBeNull()
    expect(result!.firstProbability).toBeGreaterThan(result!.secondProbability)
  })
})

describe('generateRecommendedDoublesCSV', () => {
  it('includes grouping columns for recommended doubles export', () => {
    const first = makeMatchup({ batterId: 1, pitcherId: 1 })
    const second = makeMatchup({ batterId: 2, pitcherId: 2, batterName: 'Second Batter' })
    const doubles = suggestRecommendedDoubles([first, second])
    const csv = generateRecommendedDoublesCSV(doubles)

    expect(csv).toContain('Double,Type,Combined Hit %,Parlay Odds,Leg')
    expect(csv).toContain('Smash Double')
    expect(csv).toContain('Second Batter')
  })
})

describe('buildRecommendationTags', () => {
  it('marks a lone daily double as DD plus T4 and the leftover Top 4 play as T4', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 11, ops: 0.910, h: 6, avg: 0.360, ab: 26 })
    const b = makeMatchup({ batterId: 2, pitcherId: 22, ops: 0.900, h: 5, avg: 0.385, ab: 24 })
    const c = makeMatchup({ batterId: 3, pitcherId: 33, ops: 0.840, h: 4, avg: 0.305, ab: 18 })
    const tags = buildRecommendationTags([a, b, c], suggestRecommendedDoubles([a, b, c]))

    expect(tags['123456:1:11']).toEqual(['DD', 'T4'])
    expect(tags['123456:2:22']).toEqual(['DD', 'T4'])
    expect(tags['123456:3:33']).toEqual(['T4'])
  })

  it('keeps T4 alongside smash and secondary-double tags when four plays qualify', () => {
    const smashA = makeMatchup({ batterId: 1, pitcherId: 11, ops: 0.980, h: 8, avg: 0.310, ab: 18 })
    const smashB = makeMatchup({ batterId: 2, pitcherId: 22, ops: 0.970, h: 7, avg: 0.305, ab: 18 })
    const c = makeMatchup({ batterId: 3, pitcherId: 33, avg: 0.420, ab: 45, ops: 0.910, h: 10 })
    const d = makeMatchup({ batterId: 4, pitcherId: 44, avg: 0.410, ab: 42, ops: 0.900, h: 9 })
    const doubles = suggestRecommendedDoubles([smashA, smashB, c, d])
    const tags = buildRecommendationTags([smashA, smashB, c, d], doubles)

    expect(tags['123456:1:11']).toEqual(['SMASH', 'T4'])
    expect(tags['123456:2:22']).toEqual(['SMASH', 'T4'])
    expect(tags['123456:3:33']).toEqual(['SD', 'T4'])
    expect(tags['123456:4:44']).toEqual(['SD', 'T4'])
  })
})

describe('generateCSV', () => {
  it('generates CSV with header row', () => {
    const matchup = makeMatchup()
    const csv = generateCSV([matchup])
    expect(csv).toContain('Batter,Team,Pitcher,Opp Team')
  })

  it('includes matchup data', () => {
    const matchup = makeMatchup()
    const csv = generateCSV([matchup])
    expect(csv).toContain('Test Batter')
    expect(csv).toContain('NYY')
  })
})

describe('formatCountdownToStart', () => {
  it('returns null when start is in the past', () => {
    expect(formatCountdownToStart('2020-01-01T12:00:00Z', new Date('2025-01-01T12:00:00Z').getTime())).toBeNull()
  })

  it('uses minutes under one hour', () => {
    const now = new Date('2026-04-01T17:00:00Z').getTime()
    expect(formatCountdownToStart('2026-04-01T17:45:00Z', now)).toBe('in 45m')
  })

  it('uses hours and minutes before 24h', () => {
    const now = new Date('2026-04-01T12:00:00Z').getTime()
    expect(formatCountdownToStart('2026-04-01T13:30:00Z', now)).toBe('in 1h 30m')
  })

  it('uses whole hours when minutes are zero', () => {
    const now = new Date('2026-04-01T12:00:00Z').getTime()
    expect(formatCountdownToStart('2026-04-01T14:00:00Z', now)).toBe('in 2h')
  })

  it('uses days when 24h or more', () => {
    const now = new Date('2026-04-01T12:00:00Z').getTime()
    expect(formatCountdownToStart('2026-04-03T13:00:00Z', now)).toBe('in 2d 1h')
  })
})
