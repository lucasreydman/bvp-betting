import { getGameStatus, computeHitResult } from '../lib/game-status'

describe('getGameStatus', () => {
  it.each([
    ['Scheduled', 'upcoming'],
    ['Pre-Game', 'upcoming'],
    ['Warmup', 'upcoming'],
    ['UnknownState', 'upcoming'],
    ['In Progress', 'inProgress'],
    ['Game Over', 'settled'],
    ['Final', 'settled'],
    ['Final: Tied', 'settled'],
    ['Completed Early', 'settled'],
  ])('maps %s → %s', (state, expected) => {
    expect(getGameStatus(state)).toBe(expected)
  })
})

describe('computeHitResult', () => {
  it('returns win when h > 0 and game is in progress', () => {
    expect(computeHitResult(1, 'inProgress')).toBe('win')
  })
  it('returns win when h > 0 and game is settled', () => {
    expect(computeHitResult(3, 'settled')).toBe('win')
  })
  it('returns pending when h === 0 and game is in progress', () => {
    expect(computeHitResult(0, 'inProgress')).toBe('pending')
  })
  it('returns loss when h === 0 and game is settled', () => {
    expect(computeHitResult(0, 'settled')).toBe('loss')
  })
})
