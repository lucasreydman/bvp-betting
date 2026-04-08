import { kvGet, kvSet } from './kv'

export interface ManualLineupExclusion {
  date: string
  playerId: number
  teamId?: number
  gamePk?: number
  note?: string
  createdAt: string
}

const MANUAL_LINEUP_EXCLUSIONS_KEY_PREFIX = 'manual-lineup-exclusions:'
const MANUAL_LINEUP_EXCLUSIONS_TTL_SECONDS = 7 * 24 * 60 * 60

function exclusionKey(exclusion: Pick<ManualLineupExclusion, 'playerId' | 'teamId' | 'gamePk'>): string {
  return `${exclusion.playerId}:${exclusion.teamId ?? 'any'}:${exclusion.gamePk ?? 'any'}`
}

export function getManualLineupExclusionsKey(date: string): string {
  return `${MANUAL_LINEUP_EXCLUSIONS_KEY_PREFIX}${date}`
}

export async function getManualLineupExclusions(date: string): Promise<ManualLineupExclusion[]> {
  return await kvGet<ManualLineupExclusion[]>(getManualLineupExclusionsKey(date)) ?? []
}

export function getScopedManualLineupExclusionPlayerIds(
  exclusions: ManualLineupExclusion[],
  scope: { teamId: number; gamePk: number },
): Set<number> {
  return new Set(
    exclusions
      .filter(exclusion => {
        if (exclusion.teamId != null && exclusion.teamId !== scope.teamId) return false
        if (exclusion.gamePk != null && exclusion.gamePk !== scope.gamePk) return false
        return true
      })
      .map(exclusion => exclusion.playerId)
  )
}

export async function upsertManualLineupExclusion(exclusion: ManualLineupExclusion): Promise<ManualLineupExclusion[]> {
  const existing = await getManualLineupExclusions(exclusion.date)
  const next = [
    ...existing.filter(entry => exclusionKey(entry) !== exclusionKey(exclusion)),
    exclusion,
  ].sort((left, right) => left.playerId - right.playerId || (left.teamId ?? 0) - (right.teamId ?? 0) || (left.gamePk ?? 0) - (right.gamePk ?? 0))

  await kvSet(getManualLineupExclusionsKey(exclusion.date), next, MANUAL_LINEUP_EXCLUSIONS_TTL_SECONDS)
  return next
}

export async function removeManualLineupExclusion(
  exclusion: Pick<ManualLineupExclusion, 'date' | 'playerId' | 'teamId' | 'gamePk'>,
): Promise<ManualLineupExclusion[]> {
  const existing = await getManualLineupExclusions(exclusion.date)
  const next = existing.filter(entry => exclusionKey(entry) !== exclusionKey(exclusion))

  await kvSet(getManualLineupExclusionsKey(exclusion.date), next, MANUAL_LINEUP_EXCLUSIONS_TTL_SECONDS)
  return next
}