import { NextRequest, NextResponse } from 'next/server'
import { fetchSchedule } from '@/lib/mlb-api'
import type { ScheduleResponse } from '@/lib/types'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  try {
    const games = await fetchSchedule(date)
    const response: ScheduleResponse = {
      date,
      gamesFound: games.length,
      pitchersConfirmed: games.filter(g =>
        g.teams.home.probablePitcher && g.teams.away.probablePitcher
      ).length,
      games: games.map(g => ({
        gamePk: g.gamePk,
        gameTime: g.gameDate,
        homeTeam: g.teams.home.team.name,
        awayTeam: g.teams.away.team.name,
        homeProbablePitcher: g.teams.home.probablePitcher?.fullName,
        awayProbablePitcher: g.teams.away.probablePitcher?.fullName,
      })),
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 502 })
  }
}
