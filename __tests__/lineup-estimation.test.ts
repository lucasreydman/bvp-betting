import { buildEstimatedLineup } from '@/lib/lineup-estimation'

describe('buildEstimatedLineup', () => {
  it('prioritizes recent starters ahead of inactive high-PA bats', () => {
    const result = buildEstimatedLineup({
      roster: [
        { id: 10, pa: 5200 },
        { id: 20, pa: 1800 },
        { id: 30, pa: 1600 },
      ],
      recentPositions: new Map([
        [20, [2, 2, 3, 2]],
        [30, [5, 6, 5]],
      ]),
      limit: 2,
    })

    expect(result.ids).toEqual([20, 30])
  })

  it('keeps seeded players in the estimate when the lineup is only partially known', () => {
    const result = buildEstimatedLineup({
      roster: [
        { id: 10, pa: 5000 },
        { id: 20, pa: 1200 },
        { id: 30, pa: 2200 },
      ],
      recentPositions: new Map([
        [10, [1, 1, 1]],
        [30, [4, 4, 5]],
      ]),
      seededPlayerIds: [20],
      limit: 3,
    })

    expect(result.ids[0]).toBe(20)
    expect(result.projectedPositions[20]).toBe(1)
  })

  it('respects manual exclusions while building estimated lineups', () => {
    const result = buildEstimatedLineup({
      roster: [
        { id: 10, pa: 3000 },
        { id: 20, pa: 2800 },
        { id: 30, pa: 2600 },
      ],
      recentPositions: new Map([
        [10, [2, 2, 2]],
        [20, [4, 4, 5]],
        [30, [6, 6, 7]],
      ]),
      excludedPlayerIds: [10],
      limit: 2,
    })

    expect(result.ids).toEqual([20, 30])
  })
})