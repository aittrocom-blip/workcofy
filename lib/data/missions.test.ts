import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cartaEspecialUnlockCountThisMonth, type MissionProgressEntry } from './missions'

describe('cartaEspecialUnlockCountThisMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts entries completed within the current month', () => {
    const progress: MissionProgressEntry[] = [
      { missionKey: 'a', completedAt: '2026-08-01T00:00:00Z' },
      { missionKey: 'b', completedAt: '2026-08-27T23:59:59Z' },
    ]
    expect(cartaEspecialUnlockCountThisMonth(progress)).toBe(2)
  })

  it('does not count entries completed in a prior month', () => {
    const progress: MissionProgressEntry[] = [
      { missionKey: 'a', completedAt: '2026-07-31T23:59:59Z' },
      { missionKey: 'b', completedAt: '2026-08-05T00:00:00Z' },
    ]
    expect(cartaEspecialUnlockCountThisMonth(progress)).toBe(1)
  })

  it('returns 0 for an empty array', () => {
    expect(cartaEspecialUnlockCountThisMonth([])).toBe(0)
  })
})
