import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/kv'
import { suggestDailyDouble } from '@/lib/utils'
import type { MatchupResult } from '@/lib/types'
import type { DailyDouble } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  try {
    const [top5, savedDd] = await Promise.all([
      kvGet<MatchupResult[]>(`top5:${date}`),
      kvGet<DailyDouble | null>(`dd:${date}`),
    ])

    // If top5 exists but daily double was never saved (e.g. deployed after pre-game window),
    // compute it now from the snapshot and persist it so history picks it up.
    let dailyDouble = savedDd
    if (top5 && top5.length >= 2 && dailyDouble === null) {
      dailyDouble = suggestDailyDouble(top5)
      kvSet(`dd:${date}`, dailyDouble ?? null).catch(err =>
        console.error('Failed to backfill daily double:', err)
      )
    }

    return NextResponse.json({ top5: top5 ?? null, dailyDouble: dailyDouble ?? null })
  } catch (err) {
    console.error('Snapshot read error:', err)
    return NextResponse.json({ error: 'Failed to read snapshot' }, { status: 502 })
  }
}
