interface RawStats {
  ab: number
  h: number
  doubles: number
  triples: number
  hr: number
  bb: number
  hbp: number
  sf: number
}

interface CalculatedStats {
  avg: number
  slg: number
  obp: number
  ops: number
  xbh: number
}

interface SplitStat {
  atBats: number
  hits: number
  doubles: number
  triples: number
  homeRuns: number
  baseOnBalls: number
  hitByPitch: number
  sacFlies: number
  strikeOuts: number
  rbi: number
}

export function calcStats(raw: RawStats): CalculatedStats {
  const singles = Math.max(0, raw.h - raw.doubles - raw.triples - raw.hr)
  const slg = raw.ab > 0
    ? (singles + raw.doubles * 2 + raw.triples * 3 + raw.hr * 4) / raw.ab
    : 0
  const avg = raw.ab > 0 ? raw.h / raw.ab : 0
  const obpDenominator = raw.ab + raw.bb + raw.hbp + raw.sf
  const obp = obpDenominator > 0
    ? (raw.h + raw.bb + raw.hbp) / obpDenominator
    : 0
  const ops = obp + slg
  const xbh = raw.doubles + raw.triples + raw.hr

  return { avg, slg, obp, ops, xbh }
}

export function assignConfidence(ab: number): 'high' | 'medium' | 'low' {
  if (ab >= 21) return 'high'
  if (ab >= 18) return 'medium'
  return 'low'  // 15-17 AB
}

export function parseSplit(stat: SplitStat) {
  const raw = {
    ab: stat.atBats,
    h: stat.hits,
    doubles: stat.doubles,
    triples: stat.triples,
    hr: stat.homeRuns,
    bb: stat.baseOnBalls,
    hbp: stat.hitByPitch,
    sf: stat.sacFlies,
    k: stat.strikeOuts,
    rbi: stat.rbi,
  }
  return { ...raw, ...calcStats(raw), confidence: assignConfidence(raw.ab) }
}
