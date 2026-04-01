import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/kv'
import { fetchGameBatterHits } from '@/lib/mlb-api'
import type { MatchupResult, HistoryEntry, HistoryOutcome } from '@/lib/types'
import type { DailyDouble } from '@/lib/utils'

function localDateString(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(req: NextRequest) {
  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '14', 10), 30)

  try {
    const entries: HistoryEntry[] = []

    // Collect past dates (skip today — date 0 is today, start from 1)
    const dates = Array.from({ length: days }, (_, i) => localDateString(i + 1))

    for (const date of dates) {
      // Load snapshot and saved daily double in parallel
      const [top5, dd] = await Promise.all([
        kvGet<MatchupResult[]>(`top5:${date}`),
        kvGet<DailyDouble | null>(`dd:${date}`),
      ])

      if (!dd) {
        // No saved data for this date — skip or include as empty
        entries.push({
          date,
          top5: top5 ?? null,
          dailyDoubleFirst: null,
          dailyDoubleSecond: null,
          dailyDoubleIsSmash: false,
          outcome: null,
        })
        continue
      }

      // Check outcomes (cached per date so we don't hammer the MLB API)
      const outcomeKey = `outcome:${date}`
      let outcome: HistoryOutcome | null = await kvGet<HistoryOutcome>(outcomeKey)

      if (!outcome) {
        // Compute outcomes from boxscore — only possible once the game has finished
        // (we assume all games for a past date are done)
        const [firstHits, secondHits] = await Promise.all([
          dd.first?.gamePk ? fetchGameBatterHits(dd.first.gamePk, dd.first.batterId) : Promise.resolve(null),
          dd.second?.gamePk ? fetchGameBatterHits(dd.second.gamePk, dd.second.batterId) : Promise.resolve(null),
        ])

        outcome = {
          firstHit: firstHits === null ? null : firstHits > 0,
          secondHit: secondHits === null ? null : secondHits > 0,
        }

        // Cache the outcome so future visits don't re-fetch boxscores
        kvSet(outcomeKey, outcome).catch(err =>
          console.error('Failed to cache outcome:', err)
        )
      }

      entries.push({
        date,
        top5: top5 ?? null,
        dailyDoubleFirst: dd.first ?? null,
        dailyDoubleSecond: dd.second ?? null,
        dailyDoubleIsSmash: dd.isSmash ?? false,
        outcome,
      })
    }

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('History error:', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 502 })
  }
}
