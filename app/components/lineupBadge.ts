import type { MatchupResult } from '@/lib/types'

type LineupBadgeFields = Pick<MatchupResult, 'lineupSource' | 'lineupPosition'>

export function getLineupBadgeText({ lineupSource, lineupPosition }: LineupBadgeFields) {
  if (lineupSource !== 'confirmed') return 'Estimated'
  return lineupPosition ? `Confirmed #${lineupPosition}` : 'Confirmed'
}

export function getLineupBadgeTitle({ lineupSource, lineupPosition }: LineupBadgeFields) {
  if (lineupSource !== 'confirmed') return 'Lineup not yet confirmed'
  return lineupPosition ? `Lineup confirmed, batting #${lineupPosition}` : 'Lineup confirmed'
}