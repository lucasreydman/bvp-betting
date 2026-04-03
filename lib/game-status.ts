const SETTLED_STATES = new Set(['Game Over', 'Final', 'Final: Tied', 'Completed Early'])

/**
 * Maps an MLB API detailedState string to our internal game status.
 * Defaults to 'upcoming' for any unrecognized state — safest fallback.
 */
export function getGameStatus(detailedState: string): 'upcoming' | 'inProgress' | 'settled' {
  if (detailedState === 'In Progress') return 'inProgress'
  if (SETTLED_STATES.has(detailedState)) return 'settled'
  return 'upcoming'
}

/**
 * Computes the hit result for a batter in an in-progress or settled game.
 * h: number of hits the batter has recorded today (from boxscore).
 */
export function computeHitResult(
  h: number,
  gameStatus: 'inProgress' | 'settled',
): 'win' | 'loss' | 'pending' {
  if (h > 0) return 'win'
  if (gameStatus === 'settled') return 'loss'
  return 'pending'
}
