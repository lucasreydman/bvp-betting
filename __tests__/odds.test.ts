import {
  americanToImplied,
  impliedToAmerican,
  consensusFromLines,
  normalizePlayerName,
  fmtOdds,
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
    expect(Math.abs(result!)).toBeLessThan(5)
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
})
