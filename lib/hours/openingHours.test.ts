import { describe, expect, it } from 'vitest'
import { isOpenNow, isOpenDuring, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from './openingHours'
import type { OpeningHours } from './openingHours'

function weekdayHours(day: number): OpeningHours {
  return { periods: [{ open: { day, time: '0800' }, close: { day, time: '2000' } }] }
}

describe('isOpenNow', () => {
  it('is false when hours are missing', () => {
    expect(isOpenNow(null, new Date(2026, 7, 24, 10, 0))).toBe(false)
  })

  it('is true within the open period on the matching day', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    expect(isOpenNow(weekdayHours(now.getDay()), now)).toBe(true)
  })

  it('is false outside the open period on the matching day', () => {
    const now = new Date(2026, 7, 24, 21, 0)
    expect(isOpenNow(weekdayHours(now.getDay()), now)).toBe(false)
  })

  it('is false on a day with no period', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const otherDay = (now.getDay() + 1) % 7
    expect(isOpenNow(weekdayHours(otherDay), now)).toBe(false)
  })
})

describe('isOpenDuring', () => {
  it('is false when hours are missing', () => {
    expect(isOpenDuring(null, new Date(2026, 7, 24, 10, 0), '09:00', '18:00')).toBe(false)
  })

  it('is true when the requested range sits fully inside the open period', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    expect(isOpenDuring(weekdayHours(now.getDay()), now, '09:00', '18:00')).toBe(true)
  })

  it('is false when the requested range starts before the space opens', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    expect(isOpenDuring(weekdayHours(now.getDay()), now, '07:00', '12:00')).toBe(false)
  })

  it('is false when the requested range ends after the space closes', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    expect(isOpenDuring(weekdayHours(now.getDay()), now, '09:00', '21:00')).toBe(false)
  })

  it('is false on a day with no period', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const otherDay = (now.getDay() + 1) % 7
    expect(isOpenDuring(weekdayHours(otherDay), now, '09:00', '18:00')).toBe(false)
  })

  it('is true for a 24-hour-that-day period regardless of the requested range', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const hours: OpeningHours = { periods: [{ open: { day: now.getDay(), time: '0000' }, close: null }] }
    expect(isOpenDuring(hours, now, '02:00', '23:00')).toBe(true)
  })
})

describe('formatPeriodForDay', () => {
  it('formats an open period as HH:MM – HH:MM', () => {
    expect(formatPeriodForDay(weekdayHours(1), 1)).toBe('08:00 – 20:00')
  })

  it('returns Cerrado for a day with no period', () => {
    expect(formatPeriodForDay(weekdayHours(1), 2)).toBe('Cerrado')
  })

  it('returns a message when hours are missing entirely', () => {
    expect(formatPeriodForDay(null, 1)).toBe('Horario no disponible')
  })
})

describe('DAY_LABELS and WEEK_DISPLAY_ORDER', () => {
  it('has 7 Spanish day labels indexed Sunday-first to match Google day numbering', () => {
    expect(DAY_LABELS[0]).toBe('Domingo')
    expect(DAY_LABELS[1]).toBe('Lunes')
  })

  it('displays Monday through Sunday in that order', () => {
    expect(WEEK_DISPLAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
})
