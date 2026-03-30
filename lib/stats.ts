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

export function calcStats(raw: RawStats): CalculatedStats {
  const singles = raw.h - raw.doubles - raw.triples - raw.hr
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
  if (ab >= 30) return 'high'
  if (ab >= 15) return 'medium'
  return 'low'
}
