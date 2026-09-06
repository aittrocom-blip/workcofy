import { describe, expect, it } from 'vitest'
import { formatRelativeDays } from './relativeDays'

const now = new Date('2026-09-05T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()

describe('formatRelativeDays', () => {
  it('formats today, yesterday, days, weeks and months', () => {
    expect(formatRelativeDays(daysAgo(0), now)).toBe('Hoy')
    expect(formatRelativeDays(daysAgo(1), now)).toBe('Ayer')
    expect(formatRelativeDays(daysAgo(3), now)).toBe('Hace 3 días')
    expect(formatRelativeDays(daysAgo(7), now)).toBe('Hace 1 semana')
    expect(formatRelativeDays(daysAgo(20), now)).toBe('Hace 2 semanas')
    expect(formatRelativeDays(daysAgo(40), now)).toBe('Hace 1 mes')
    expect(formatRelativeDays(daysAgo(95), now)).toBe('Hace 3 meses')
  })
})
