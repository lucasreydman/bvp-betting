import { NextRequest, NextResponse } from 'next/server'
import { fetchBvP } from '@/lib/mlb-api'
import { calcStats, assignConfidence } from '@/lib/stats'
import { createCache } from '@/lib/cache'

const bvpCache = createCache<ReturnType<typeof calcStats> & { ab: number; confidence: string }>(3600_000)

export async function GET(req: NextRequest) {
  const batterId = Number(req.nextUrl.searchParams.get('batterId'))
  const pitcherId = Number(req.nextUrl.searchParams.get('pitcherId'))
  if (!batterId || !pitcherId) {
    return NextResponse.json({ error: 'batterId and pitcherId are required' }, { status: 400 })
  }

  const cacheKey = `${batterId}:${pitcherId}`
  const cached = bvpCache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const split = await fetchBvP(batterId, pitcherId)
  if (!split || split.stat.atBats === 0) {
    return NextResponse.json({ error: 'No BvP data found' }, { status: 404 })
  }

  const raw = {
    ab: split.stat.atBats,
    h: split.stat.hits,
    doubles: split.stat.doubles,
    triples: split.stat.triples,
    hr: split.stat.homeRuns,
    bb: split.stat.baseOnBalls,
    hbp: split.stat.hitByPitch,
    sf: split.stat.sacFlies,
    k: split.stat.strikeOuts,
    rbi: split.stat.rbi,
  }
  const calculated = calcStats(raw)
  const confidence = assignConfidence(raw.ab)
  const result = { ...raw, ...calculated, confidence }
  bvpCache.set(cacheKey, result)
  return NextResponse.json(result)
}
