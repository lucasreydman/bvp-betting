import { NextRequest, NextResponse } from 'next/server'
import { kvDel } from '@/lib/kv'
import {
  getManualLineupExclusions,
  removeManualLineupExclusion,
  upsertManualLineupExclusion,
} from '@/lib/manual-lineup-exclusions'
import { formatSlateDate } from '@/lib/utils'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function getAdminSecret(): string | null {
  return process.env.MANUAL_OVERRIDE_SECRET ?? null
}

function isAuthorized(req: NextRequest): boolean {
  const secret = getAdminSecret()
  if (!secret) return false

  const bearer = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  return bearer === `Bearer ${secret}` || querySecret === secret
}

function validateDate(date: unknown): string | null {
  if (typeof date !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function validatePositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) return null
  return value
}

async function invalidateMatchupsResponse(date: string): Promise<void> {
  await kvDel(`matchups-response:${date}`)
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return await req.json() as Record<string, unknown>
  } catch {
    return {}
  }
}

function unauthorizedResponse(): NextResponse {
  const secret = getAdminSecret()
  if (!secret) {
    return NextResponse.json({ error: 'MANUAL_OVERRIDE_SECRET is not configured' }, { status: 503, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse()

  const date = validateDate(req.nextUrl.searchParams.get('date')) ?? formatSlateDate()
  const exclusions = await getManualLineupExclusions(date)
  return NextResponse.json({ date, exclusions }, { headers: NO_STORE_HEADERS })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse()

  const body = await parseBody(req)
  const date = validateDate(body.date) ?? formatSlateDate()
  const playerId = validatePositiveInteger(body.playerId)
  const parsedTeamId = body.teamId == null ? undefined : validatePositiveInteger(body.teamId)
  const parsedGamePk = body.gamePk == null ? undefined : validatePositiveInteger(body.gamePk)
  const note = typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : undefined

  if (!playerId) {
    return NextResponse.json({ error: 'playerId must be a positive integer' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (body.teamId != null && !parsedTeamId) {
    return NextResponse.json({ error: 'teamId must be a positive integer when provided' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (body.gamePk != null && !parsedGamePk) {
    return NextResponse.json({ error: 'gamePk must be a positive integer when provided' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const teamId = parsedTeamId ?? undefined
  const gamePk = parsedGamePk ?? undefined

  const exclusions = await upsertManualLineupExclusion({
    date,
    playerId,
    teamId,
    gamePk,
    note,
    createdAt: new Date().toISOString(),
  })

  await invalidateMatchupsResponse(date)

  return NextResponse.json({ ok: true, date, exclusions }, { headers: NO_STORE_HEADERS })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse()

  const body = await parseBody(req)
  const date = validateDate(body.date) ?? formatSlateDate()
  const playerId = validatePositiveInteger(body.playerId)
  const parsedTeamId = body.teamId == null ? undefined : validatePositiveInteger(body.teamId)
  const parsedGamePk = body.gamePk == null ? undefined : validatePositiveInteger(body.gamePk)

  if (!playerId) {
    return NextResponse.json({ error: 'playerId must be a positive integer' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (body.teamId != null && !parsedTeamId) {
    return NextResponse.json({ error: 'teamId must be a positive integer when provided' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (body.gamePk != null && !parsedGamePk) {
    return NextResponse.json({ error: 'gamePk must be a positive integer when provided' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const teamId = parsedTeamId ?? undefined
  const gamePk = parsedGamePk ?? undefined

  const exclusions = await removeManualLineupExclusion({ date, playerId, teamId, gamePk })
  await invalidateMatchupsResponse(date)

  return NextResponse.json({ ok: true, date, exclusions }, { headers: NO_STORE_HEADERS })
}