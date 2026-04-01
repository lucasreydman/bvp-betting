import { NextRequest, NextResponse } from 'next/server'
import { kvGet } from '@/lib/kv'
import type { MatchupResult } from '@/lib/types'
import type { DailyDouble } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  try {
    const [top5, dailyDouble] = await Promise.all([
      kvGet<MatchupResult[]>(`top5:${date}`),
      kvGet<DailyDouble | null>(`dd:${date}`),
    ])
    return NextResponse.json({ top5: top5 ?? null, dailyDouble: dailyDouble ?? null })
  } catch (err) {
    console.error('Snapshot read error:', err)
    return NextResponse.json({ error: 'Failed to read snapshot' }, { status: 502 })
  }
}
