import { NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/kv'
import { fetchGameBatterHits } from '@/lib/mlb-api'
import type { HistoryOutcome, AllTimeStats, StatsBucket, MatchupResult } from '@/lib/types'
import type { DailyDouble } from '@/lib/utils'

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function classify(outcome: HistoryOutcome): 'win' | 'loss' | 'pending' {
  if (outcome.firstHit === null || outcome.secondHit === null) return 'pending'
  return outcome.firstHit && outcome.secondHit ? 'win' : 'loss'
}

function addToBucket(bucket: StatsBucket, result: 'win' | 'loss' | 'pending') {
  bucket.total++
  if (result === 'win') bucket.wins++
  else if (result === 'loss') bucket.losses++
  else bucket.pending++
}

export async function GET() {
  try {
    const stats: AllTimeStats = {
      overall: { total: 0, wins: 0, losses: 0, pending: 0 },
      smash: { total: 0, wins: 0, losses: 0, pending: 0 },
      legs: { total: 0, hits: 0, pending: 0 },
    }

    const MAX_DAYS = 365
    const STOP_AFTER_EMPTY = 14
    let consecutiveEmpty = 0

    for (let i = 1; i <= MAX_DAYS; i++) {
      if (consecutiveEmpty >= STOP_AFTER_EMPTY) break

      const date = dateStringDaysAgo(i)
      const [dd, top5] = await Promise.all([
        kvGet<DailyDouble | null>(`dd:${date}`),
        kvGet<MatchupResult[]>(`top5:${date}`),
      ])

      if (!dd) {
        if (!top5) consecutiveEmpty++
        continue
      }
      consecutiveEmpty = 0

      // --- Daily Double win/loss ---
      const outcomeKey = `outcome:${date}`
      let outcome = await kvGet<HistoryOutcome>(outcomeKey)

      const isPending = outcome && outcome.firstHit === null && outcome.secondHit === null
      if (!outcome || isPending) {
        const [firstHits, secondHits] = await Promise.all([
          dd.first?.gamePk ? fetchGameBatterHits(dd.first.gamePk, dd.first.batterId) : Promise.resolve(null),
          dd.second?.gamePk ? fetchGameBatterHits(dd.second.gamePk, dd.second.batterId) : Promise.resolve(null),
        ])
        outcome = {
          firstHit: firstHits === null ? null : firstHits > 0,
          secondHit: secondHits === null ? null : secondHits > 0,
        }
        if (outcome.firstHit !== null || outcome.secondHit !== null) {
          kvSet(outcomeKey, outcome).catch(err => console.error('Failed to cache outcome:', err))
        }
      }

      const result = classify(outcome)
      addToBucket(stats.overall, result)
      if (dd.isSmash) addToBucket(stats.smash, result)

      // --- Individual legs: all top 5 picks ---
      if (top5 && top5.length > 0) {
        const top5OutcomeKey = `top5outcome:${date}`
        let top5Hits = await kvGet<(boolean | null)[]>(top5OutcomeKey)

        const allResolved = top5Hits && top5Hits.every(h => h !== null)
        if (!top5Hits || !allResolved) {
          const hits = await Promise.all(
            top5.map(m => m.gamePk ? fetchGameBatterHits(m.gamePk, m.batterId) : Promise.resolve(null))
          )
          top5Hits = hits.map(h => h === null ? null : h > 0)
          if (top5Hits.some(h => h !== null)) {
            kvSet(top5OutcomeKey, top5Hits).catch(err => console.error('Failed to cache top5 outcomes:', err))
          }
        }

        for (const hit of top5Hits) {
          if (hit !== null) {
            stats.legs.total++
            if (hit) stats.legs.hits++
          } else {
            stats.legs.pending++
          }
        }
      }
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 502 })
  }
}
