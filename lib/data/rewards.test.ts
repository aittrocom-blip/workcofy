import { describe, expect, it } from 'vitest'
import { rewardsBalanceFrom, type RewardEvent } from './rewards'

function makeEvent(coins: number): RewardEvent {
  return {
    id: 'id',
    label: 'label',
    coins,
    spaceName: null,
    createdAt: '2026-08-28T00:00:00Z',
  }
}

describe('rewardsBalanceFrom', () => {
  it('sums coins across multiple events', () => {
    const events = [makeEvent(10), makeEvent(5), makeEvent(20)]
    expect(rewardsBalanceFrom(events)).toBe(35)
  })

  it('returns 0 for an empty array', () => {
    expect(rewardsBalanceFrom([])).toBe(0)
  })
})
