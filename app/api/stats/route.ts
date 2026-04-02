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
    const SCAN_BATCH = 30  // dates fetched in parallel per round

    for (let batchStart = 1; batchStart <= MAX_DAYS; batchStart += SCAN_BATCH) {
      const batchSize = Math.min(SCAN_BATCH, MAX_DAYS - batchStart + 1)
      const dates = Array.from({ length: batchSize }, (_, i) => dateStringDaysAgo(batchStart + i))

      // Phase 1: fetch dd + top5 for all dates in this batch in parallel
      const baseData = await Promise.all(
        dates.map(date => Promise.all([
          kvGet<DailyDouble | null>(`dd:${date}`),
          kvGet<MatchupResult[]>(`top5:${date}`),
        ]))
      )

      // Stop scanning if no data found anywhere in this batch
      if (!baseData.some(([dd, top5]) => dd !== null || top5 !== null)) break

      // Dates that have a saved DD (non-null)
      const ddEntries = dates
        .map((date, i) => ({ date, dd: baseData[i][0], top5: baseData[i][1] }))
        .filter((x): x is { date: string; dd: DailyDouble; top5: MatchupResult[] | null } => x.dd !== null)

      // Dates that have a saved top5
      const top5Entries = dates
        .map((date, i) => ({ date, top5: baseData[i][1] }))
        .filter((x): x is { date: string; top5: MatchupResult[] } => x.top5 !== null && x.top5.length > 0)

      // Phase 2: fetch cached outcomes + top5outcomes for all relevant dates in parallel
      const [cachedOutcomes, cachedTop5Outcomes] = await Promise.all([
        Promise.all(ddEntries.map(({ date }) => kvGet<HistoryOutcome>(`outcome:${date}`))),
        Promise.all(top5Entries.map(({ date }) => kvGet<(boolean | null)[]>(`top5outcome:${date}`))),
      ])

      // Phase 3: resolve missing/pending DD outcomes in parallel
      const resolvedOutcomes = await Promise.all(
        ddEntries.map(async ({ date, dd }, i) => {
          let outcome = cachedOutcomes[i]
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
              kvSet(`outcome:${date}`, outcome).catch(err => console.error('Failed to cache outcome:', err))
            }
          }
          return { dd, outcome: outcome! }
        })
      )

      // Phase 4: resolve missing/incomplete top5 outcomes in parallel
      const resolvedTop5Outcomes = await Promise.all(
        top5Entries.map(async ({ date, top5 }, i) => {
          let hits = cachedTop5Outcomes[i]
          const allResolved = hits && hits.every(h => h !== null)
          if (!hits || !allResolved) {
            const fetched = await Promise.all(
              top5.map(m => m.gamePk ? fetchGameBatterHits(m.gamePk, m.batterId) : Promise.resolve(null))
            )
            hits = fetched.map(h => h === null ? null : h > 0)
            if (hits.some(h => h !== null)) {
              kvSet(`top5outcome:${date}`, hits).catch(err => console.error('Failed to cache top5 outcomes:', err))
            }
          }
          return hits!
        })
      )

      // Accumulate DD stats
      for (const { dd, outcome } of resolvedOutcomes) {
        const result = classify(outcome)
        addToBucket(stats.overall, result)
        if (dd.isSmash) addToBucket(stats.smash, result)
      }

      // Accumulate top5 leg stats
      for (const hits of resolvedTop5Outcomes) {
        for (const hit of hits) {
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
