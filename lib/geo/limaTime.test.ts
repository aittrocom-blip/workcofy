import { describe, expect, it } from 'vitest'
import { getLimaNow } from './limaTime'

/**
 * These assertions are independent of both the current moment and the host's
 * system timezone: a fixed UTC instant is converted to Lima wall-clock time
 * (UTC-5, no DST), and the result is read through the local getters that
 * isOpenNow/formatPeriodForDay use.
 */
describe('getLimaNow', () => {
  it('reports Lima wall-clock components for a fixed instant', () => {
    // 2026-08-26 03:30:15 UTC === 2026-08-25 22:30:15 in Lima (UTC-5)
    const lima = getLimaNow(new Date(Date.UTC(2026, 7, 26, 3, 30, 15)))

    expect(lima.getFullYear()).toBe(2026)
    expect(lima.getMonth()).toBe(7) // August
    expect(lima.getDate()).toBe(25)
    expect(lima.getHours()).toBe(22)
    expect(lima.getMinutes()).toBe(30)
    expect(lima.getSeconds()).toBe(15)
  })

  it('rolls the local day index back when Lima is still on the previous day', () => {
    // 2026-08-26 02:00 UTC is a Wednesday in UTC but still Tuesday in Lima.
    const lima = getLimaNow(new Date(Date.UTC(2026, 7, 26, 2, 0, 0)))

    expect(lima.getDay()).toBe(2) // Tuesday
    expect(lima.getHours()).toBe(21)
  })

  it('normalizes Lima midnight to hour 0', () => {
    // 2026-08-26 05:00 UTC === 2026-08-26 00:00 in Lima.
    const lima = getLimaNow(new Date(Date.UTC(2026, 7, 26, 5, 0, 0)))

    expect(lima.getHours()).toBe(0)
    expect(lima.getDate()).toBe(26)
  })

  it('returns a Date when called with no argument', () => {
    expect(getLimaNow()).toBeInstanceOf(Date)
  })
})
