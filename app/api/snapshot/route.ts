import { NextRequest, NextResponse } from 'next/server'
import { kvGet } from '@/lib/kv'
import type { MatchupResult } from '@/lib/types'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  try {
    const top5 = await kvGet<MatchupResult[]>(`top5:${date}`)
    return NextResponse.json({ top5: top5 ?? null })
  } catch (err) {
    console.error('Snapshot read error:', err)
    return NextResponse.json({ error: 'Failed to read snapshot' }, { status: 502 })
  }
}
