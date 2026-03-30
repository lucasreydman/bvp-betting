import { formatTime, formatCountdownToStart, generateCSV, applyFilters, sortMatchups } from '@/lib/utils'
import { DEFAULT_FILTERS, type MatchupResult } from '@/lib/types'

const makeMatchup = (overrides: Partial<MatchupResult> = {}): MatchupResult => ({
  batterId: 1,
  batterName: 'Test Batter',
  batterTeam: 'NYY',
  batterTeamId: 147,
  pitcherId: 2,
  pitcherName: 'Test Pitcher',
  pitcherTeam: 'BOS',
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
  ...overrides,
})

describe('formatTime', () => {
  it('formats ISO string in the runtime local timezone', () => {
    const result = formatTime('2026-04-01T18:05:00Z')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
    expect(result).toMatch(/AM|PM/)
  })
})

describe('applyFilters', () => {
  it('returns matchup that passes all filters', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.400, slg: 0.700, ops: 1.178 })
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
  })

  it('excludes matchup that fails one filter (AND logic)', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.200, slg: 0.700, ops: 1.178 }) // avg too low
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(0)
  })

  it('excludes matchup below minAB', () => {
    const matchup = makeMatchup({ ab: 9, avg: 0.400, slg: 0.700, ops: 1.178 })
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(0)
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
