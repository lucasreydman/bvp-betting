import { formatTime, formatLocalDate, formatCountdownToStart, generateCSV, applyFilters, sortMatchups, regressedAvg, expectedAtBats, hitProbability, suggestDailyDouble } from '@/lib/utils'
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

describe('hitProbability', () => {
  it('computes probability of at least one hit in multiple AB', () => {
    expect(hitProbability(0.4, 4)).toBeCloseTo(0.8704)
  })
})

describe('suggestDailyDouble', () => {
  it('returns the single best pair with different pitchers', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.300, ab: 40 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.320, ab: 30 })
    const c = makeMatchup({ batterId: 3, pitcherId: 3, avg: 0.350, ab: 20 })
    const result = suggestDailyDouble([a, b, c])

    expect(result).not.toBeNull()
    expect(result!.first.batterId).not.toBe(result!.second.batterId)
    expect(result!.first.pitcherId).not.toBe(result!.second.pitcherId)
    expect(result!.combinedProbability).toBeGreaterThan(0)
  })

  it('marks isSmash when both legs have OPS > 0.950 and H >= 7', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.380, ab: 35, ops: 0.980, h: 13 })
    const result = suggestDailyDouble([a, b])

    expect(result).not.toBeNull()
    expect(result!.isSmash).toBe(true)
  })

  it('does not mark isSmash when one leg is below 0.950 OPS', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.380, ab: 35, ops: 0.900, h: 13 })
    const result = suggestDailyDouble([a, b])

    expect(result).not.toBeNull()
    expect(result!.isSmash).toBe(false)
  })

  it('does not mark isSmash when one leg has fewer than 7 hits', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.400, ab: 40, ops: 1.100, h: 16 })
    const b = makeMatchup({ batterId: 2, pitcherId: 2, avg: 0.333, ab: 15, ops: 0.980, h: 5 })
    const result = suggestDailyDouble([a, b])

    expect(result).not.toBeNull()
    expect(result!.isSmash).toBe(false)
  })

  it('returns null when no valid pairs exist', () => {
    const a = makeMatchup({ batterId: 1, pitcherId: 1, avg: 0.300, ab: 40 })
    expect(suggestDailyDouble([a])).toBeNull()
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
