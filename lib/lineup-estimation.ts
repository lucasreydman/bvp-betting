import { medianLineupPosition } from './utils'

export interface LineupEstimationCandidate {
  id: number
  pa: number
}

interface BuildEstimatedLineupInput {
  roster: LineupEstimationCandidate[]
  recentPositions: Map<number, number[]>
  seededPlayerIds?: number[]
  excludedPlayerIds?: Iterable<number>
  limit?: number
}

interface EstimatedLineupResult {
  ids: number[]
  projectedPositions: Record<number, number>
}

export function buildEstimatedLineup({
  roster,
  recentPositions,
  seededPlayerIds = [],
  excludedPlayerIds = [],
  limit = 9,
}: BuildEstimatedLineupInput): EstimatedLineupResult {
  const rosterIds = new Set(roster.map(player => player.id))
  const excludedIds = new Set(excludedPlayerIds)

  const seededIds = [...new Set(seededPlayerIds)]
    .filter(playerId => rosterIds.has(playerId) && !excludedIds.has(playerId))

  const seededIdSet = new Set(seededIds)
  const rankedCandidates = roster
    .filter(player => !seededIdSet.has(player.id) && !excludedIds.has(player.id))
    .sort((left, right) => {
      const leftPositions = recentPositions.get(left.id) ?? []
      const rightPositions = recentPositions.get(right.id) ?? []
      const leftStarts = leftPositions.length
      const rightStarts = rightPositions.length

      if (rightStarts !== leftStarts) return rightStarts - leftStarts

      const leftMedian = medianLineupPosition(leftPositions) ?? 9
      const rightMedian = medianLineupPosition(rightPositions) ?? 9
      if (leftMedian !== rightMedian) return leftMedian - rightMedian

      if (right.pa !== left.pa) return right.pa - left.pa
      return left.id - right.id
    })

  const ids = [...seededIds, ...rankedCandidates.map(player => player.id)].slice(0, limit)
  const projectedPositions = Object.fromEntries(
    ids.map((playerId, index) => {
      const seededIndex = seededIds.indexOf(playerId)
      if (seededIndex >= 0) return [playerId, seededIndex + 1]

      const preferredSlot = medianLineupPosition(recentPositions.get(playerId) ?? [])
      return [playerId, preferredSlot ?? index + 1]
    })
  )

  return { ids, projectedPositions }
}