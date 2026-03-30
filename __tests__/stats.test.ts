import { calcStats, assignConfidence } from '@/lib/stats'

describe('calcStats', () => {
  it('calculates AVG correctly', () => {
    const result = calcStats({ ab: 10, h: 4, doubles: 1, triples: 0, hr: 1, bb: 1, hbp: 0, sf: 0 })
    expect(result.avg).toBeCloseTo(0.4)
  })

  it('calculates SLG correctly', () => {
    // 1B=2, 2B=1, 3B=0, HR=1 → (2*1 + 1*2 + 0*3 + 1*4) / 10 = 8/10 = 0.800
    const result = calcStats({ ab: 10, h: 4, doubles: 1, triples: 0, hr: 1, bb: 1, hbp: 0, sf: 0 })
    expect(result.slg).toBeCloseTo(0.8)
  })

  it('calculates OBP correctly', () => {
    // (H + BB + HBP) / (AB + BB + HBP + SF) = (4 + 1 + 0) / (10 + 1 + 0 + 0) = 5/11
    const result = calcStats({ ab: 10, h: 4, doubles: 1, triples: 0, hr: 1, bb: 1, hbp: 0, sf: 0 })
    expect(result.obp).toBeCloseTo(5 / 11)
  })

  it('calculates OPS as OBP + SLG', () => {
    const result = calcStats({ ab: 10, h: 4, doubles: 1, triples: 0, hr: 1, bb: 1, hbp: 0, sf: 0 })
    expect(result.ops).toBeCloseTo(result.obp + result.slg)
  })

  it('calculates XBH as 2B + 3B + HR', () => {
    const result = calcStats({ ab: 10, h: 6, doubles: 2, triples: 1, hr: 1, bb: 0, hbp: 0, sf: 0 })
    expect(result.xbh).toBe(4)
  })

  it('handles HBP and SF in OBP', () => {
    // (H + BB + HBP) / (AB + BB + HBP + SF) = (3 + 0 + 2) / (10 + 0 + 2 + 1) = 5/13
    const result = calcStats({ ab: 10, h: 3, doubles: 0, triples: 0, hr: 0, bb: 0, hbp: 2, sf: 1 })
    expect(result.obp).toBeCloseTo(5 / 13)
  })

  it('returns OBP of 0 when denominator is 0', () => {
    // Edge case: AB=0, BB=0, HBP=0, SF=0
    const result = calcStats({ ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, bb: 0, hbp: 0, sf: 0 })
    expect(result.obp).toBe(0)
  })
})

describe('assignConfidence', () => {
  it('returns high for 30+ AB', () => {
    expect(assignConfidence(30)).toBe('high')
    expect(assignConfidence(50)).toBe('high')
  })

  it('returns medium for 15-29 AB', () => {
    expect(assignConfidence(15)).toBe('medium')
    expect(assignConfidence(29)).toBe('medium')
  })

  it('returns low for 10-14 AB', () => {
    expect(assignConfidence(10)).toBe('low')
    expect(assignConfidence(14)).toBe('low')
  })
})
