import type { MatchupResult } from '@/lib/types'

type LineupBadgeFields = Pick<MatchupResult, 'lineupSource' | 'lineupPosition' | 'predictedLineupPosition'>

export function getLineupBadgeText({ lineupSource, lineupPosition, predictedLineupPosition }: LineupBadgeFields) {
  if (lineupSource !== 'confirmed') return predictedLineupPosition ? `Estimated #${predictedLineupPosition}` : 'Estimated'
  return lineupPosition ? `Confirmed #${lineupPosition}` : 'Confirmed'
}

export function getLineupBadgeTitle({ lineupSource, lineupPosition, predictedLineupPosition }: LineupBadgeFields) {
  if (lineupSource !== 'confirmed') {
    return predictedLineupPosition
      ? `Estimated lineup, projected batting #${predictedLineupPosition} from recent batting-order median`
      : 'Lineup not yet confirmed'
  }
  return lineupPosition ? `Lineup confirmed, batting #${lineupPosition}` : 'Lineup confirmed'
}