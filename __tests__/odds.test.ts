import {
  americanToImplied,
  impliedToAmerican,
  consensusFromLines,
  normalizePlayerName,
  fmtOdds,
  parlayOddsFromLines,
  buildOddsMap,
} from '@/lib/odds'

describe('americanToImplied', () => {
  it('converts positive American odds to implied probability', () => {
    expect(americanToImplied(100)).toBeCloseTo(0.5)
    expect(americanToImplied(200)).toBeCloseTo(0.3333, 3)
    expect(americanToImplied(150)).toBeCloseTo(0.4, 3)
  })

  it('converts negative American odds to implied probability', () => {
    expect(americanToImplied(-110)).toBeCloseTo(0.5238, 3)
    expect(americanToImplied(-150)).toBeCloseTo(0.6, 3)
    expect(americanToImplied(-200)).toBeCloseTo(0.6667, 3)
  })
})

describe('impliedToAmerican', () => {
  it('converts implied probability below 0.5 to positive odds', () => {
    expect(impliedToAmerican(0.5)).toBeCloseTo(100, 0)
    expect(impliedToAmerican(0.4)).toBeCloseTo(150, 0)
    expect(impliedToAmerican(0.3333)).toBeCloseTo(200, 0)
  })

  it('converts implied probability above 0.5 to negative odds', () => {
    expect(impliedToAmerican(0.5238)).toBeCloseTo(-110, 0)
    expect(impliedToAmerican(0.6)).toBeCloseTo(-150, 0)
  })

  it('round-trips through americanToImplied', () => {
    for (const american of [100, 150, 200, -110, -150, -200]) {
      const roundTripped = impliedToAmerican(americanToImplied(american))
      expect(Math.round(roundTripped)).toBe(american)
    }
  })
})

describe('consensusFromLines', () => {
  it('returns null for empty input', () => {
    expect(consensusFromLines([])).toBeNull()
  })

  it('returns single line unchanged (round-trip)', () => {
    const result = consensusFromLines([-130])
    expect(result).not.toBeNull()
    expect(Math.round(result!)).toBe(-130)
  })

  it('averages two symmetric lines around even money', () => {
    const result = consensusFromLines([100, -100])
    expect(result).not.toBeNull()
    expect(Math.round(result!)).toBe(100)  // even money = +100
  })

  it('averages asymmetric multi-book lines', () => {
    // -115 implied ≈ 0.535, -110 ≈ 0.524, -120 ≈ 0.545 → avg ≈ 0.535 → consensus ≈ -115
    const result = consensusFromLines([-115, -110, -120])
    expect(result).not.toBeNull()
    expect(result!).toBeLessThan(-100)  // should remain negative (favorite)
    expect(result!).toBeGreaterThan(-125)  // but not extreme
  })

  it('averages multiple lines via implied probability', () => {
    const result = consensusFromLines([-110, -110, -110, -110])
    expect(result).not.toBeNull()
    expect(Math.round(result!)).toBe(-110)
  })
})

describe('normalizePlayerName', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizePlayerName('Shohei Ohtani')).toBe('shohei ohtani')
    expect(normalizePlayerName("Ronald Acuña Jr.")).toBe('ronald acuna jr')
    expect(normalizePlayerName('José Abreu')).toBe('jose abreu')
  })

  it('normalizes accented characters', () => {
    expect(normalizePlayerName('Yoán Moncada')).toBe('yoan moncada')
  })

  it('collapses multiple spaces and trims', () => {
    expect(normalizePlayerName('  Juan  Soto  ')).toBe('juan soto')
  })
})

describe('fmtOdds', () => {
  it('prefixes positive odds with +', () => {
    expect(fmtOdds(150)).toBe('+150')
    expect(fmtOdds(100)).toBe('+100')
  })

  it('returns negative odds as-is', () => {
    expect(fmtOdds(-110)).toBe('-110')
    expect(fmtOdds(-200)).toBe('-200')
  })

  it('handles zero (even money)', () => {
    expect(fmtOdds(0)).toBe('+0')
  })
})

describe('parlayOddsFromLines', () => {
  it('returns null when either leg is missing odds', () => {
    expect(parlayOddsFromLines(-110, null)).toBeNull()
    expect(parlayOddsFromLines(undefined, 120)).toBeNull()
  })

  it('combines two American prices into parlay American odds', () => {
    expect(parlayOddsFromLines(-110, -110)).toBe(264)
    expect(parlayOddsFromLines(100, 100)).toBe(300)
  })
})

describe('buildOddsMap', () => {
  it('builds a map keyed by normalized name', () => {
    const rows = [
      { batterNameNormalized: 'shohei ohtani', consensusHitOddsAmerican: -130, bookCount: 4 },
      { batterNameNormalized: 'mike trout', consensusHitOddsAmerican: 110, bookCount: 3 },
    ]
    const map = buildOddsMap(rows)
    expect(map.get('shohei ohtani')?.consensusHitOddsAmerican).toBe(-130)
    expect(map.get('mike trout')?.consensusHitOddsAmerican).toBe(110)
  })

  it('first-entry-wins on duplicate names', () => {
    const rows = [
      { batterNameNormalized: 'player a', consensusHitOddsAmerican: -130, bookCount: 6 },
      { batterNameNormalized: 'player a', consensusHitOddsAmerican: -120, bookCount: 6 },
    ]
    const map = buildOddsMap(rows)
    expect(map.get('player a')?.consensusHitOddsAmerican).toBe(-130)
  })
})
