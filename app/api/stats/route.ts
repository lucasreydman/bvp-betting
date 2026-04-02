import { NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/kv'
import { fetchGameBatterHits } from '@/lib/mlb-api'
import type { HistoryOutcome, AllTimeStats, StatsBucket } from '@/lib/types'
import type { DailyDouble } from '@/lib/utils'

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function classify(outcome: HistoryOutcome): 'win' | 'split' | 'loss' | 'pending' {
  if (outcome.firstHit === null || outcome.secondHit === null) return 'pending'
  if (outcome.firstHit && outcome.secondHit) return 'win'
  if (!outcome.firstHit && !outcome.secondHit) return 'loss'
  return 'split'
}

function addToBucket(bucket: StatsBucket, result: 'win' | 'split' | 'loss' | 'pending') {
  bucket.total++
  bucket[result === 'win' ? 'wins' : result === 'split' ? 'splits' : result === 'loss' ? 'losses' : 'pending']++
}

export async function GET() {
  try {
    const stats: AllTimeStats = {
      overall: { total: 0, wins: 0, splits: 0, losses: 0, pending: 0 },
      smash: { total: 0, wins: 0, splits: 0, losses: 0, pending: 0 },
      legs: { total: 0, hits: 0, pending: 0 },
    }

    const MAX_DAYS = 365
    const STOP_AFTER_EMPTY = 14
    let consecutiveEmpty = 0

    for (let i = 1; i <= MAX_DAYS; i++) {
      if (consecutiveEmpty >= STOP_AFTER_EMPTY) break

      const date = dateStringDaysAgo(i)
      const dd = await kvGet<DailyDouble | null>(`dd:${date}`)

      if (!dd) {
        consecutiveEmpty++
        continue
      }
      consecutiveEmpty = 0

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

      // Individual leg tallies (only count legs where outcome is known)
      if (outcome.firstHit !== null) {
        stats.legs.total++
        if (outcome.firstHit) stats.legs.hits++
      } else {
        stats.legs.pending++
      }
      if (outcome.secondHit !== null) {
        stats.legs.total++
        if (outcome.secondHit) stats.legs.hits++
      } else {
        stats.legs.pending++
      }
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 502 })
  }
}
