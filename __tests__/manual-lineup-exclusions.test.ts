import { getScopedManualLineupExclusionPlayerIds } from '@/lib/manual-lineup-exclusions'

describe('getScopedManualLineupExclusionPlayerIds', () => {
  it('returns global, team-scoped, and game-scoped exclusions that match the candidate game', () => {
    const excludedPlayerIds = getScopedManualLineupExclusionPlayerIds([
      { date: '2026-04-08', playerId: 10, createdAt: '2026-04-08T10:00:00.000Z' },
      { date: '2026-04-08', playerId: 20, teamId: 116, createdAt: '2026-04-08T10:00:00.000Z' },
      { date: '2026-04-08', playerId: 30, gamePk: 123, createdAt: '2026-04-08T10:00:00.000Z' },
      { date: '2026-04-08', playerId: 40, teamId: 120, createdAt: '2026-04-08T10:00:00.000Z' },
      { date: '2026-04-08', playerId: 50, gamePk: 456, createdAt: '2026-04-08T10:00:00.000Z' },
    ], { teamId: 116, gamePk: 123 })

    expect([...excludedPlayerIds].sort((left, right) => left - right)).toEqual([10, 20, 30])
  })
})