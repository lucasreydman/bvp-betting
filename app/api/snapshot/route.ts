import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet, kvDel } from '@/lib/kv'
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

// POST /api/snapshot?date=YYYY-MM-DD — recompute Daily Double from stored top5 (fixes bad saved DD)
export async function POST(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  try {
    const top5 = await kvGet<MatchupResult[]>(`top5:${date}`)
    if (!top5 || top5.length < 2) {
      return NextResponse.json({ error: 'No top5 snapshot found for this date' }, { status: 404 })
    }

    await kvDel(`dd:${date}`)
    const dailyDouble = suggestDailyDouble(top5)
    await kvSet(`dd:${date}`, dailyDouble ?? null)

    return NextResponse.json({ date, dailyDouble })
  } catch (err) {
    console.error('Snapshot recompute error:', err)
    return NextResponse.json({ error: 'Failed to recompute snapshot' }, { status: 502 })
  }
}
