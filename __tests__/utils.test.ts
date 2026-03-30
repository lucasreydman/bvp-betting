import { formatET, generateCSV, applyFilters, sortMatchups } from '@/lib/utils'
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

describe('formatET', () => {
  it('formats ISO string to ET time', () => {
    // 2026-04-01T18:05:00Z = 2:05 PM ET (UTC-4 in April)
    const result = formatET('2026-04-01T18:05:00Z')
    expect(result).toMatch(/2:05 PM E[DS]T/)
  })
})

describe('applyFilters', () => {
  it('returns matchup that passes all filters', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.400, slg: 0.700, ops: 1.178, hr: 2 })
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
  })

  it('excludes matchup that fails one filter (AND logic)', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.200, slg: 0.700, ops: 1.178, hr: 2 }) // avg too low
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(0)
  })

  it('uses >= semantics (minHR=1 includes HR=1)', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.400, slg: 0.700, ops: 1.178, hr: 1 })
    const result = applyFilters([matchup], DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
  })

  it('excludes matchup with HR=0 when minHR=1', () => {
    const matchup = makeMatchup({ ab: 20, avg: 0.400, slg: 0.700, ops: 1.178, hr: 0 })
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
