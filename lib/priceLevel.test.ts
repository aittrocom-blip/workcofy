import { describe, expect, it } from 'vitest'
import { formatPriceLevel } from './priceLevel'

describe('formatPriceLevel', () => {
  it('returns null when the level is unknown', () => {
    expect(formatPriceLevel(null)).toBeNull()
  })

  it('renders one $ per level', () => {
    expect(formatPriceLevel(1)).toBe('$')
    expect(formatPriceLevel(2)).toBe('$$')
    expect(formatPriceLevel(3)).toBe('$$$')
    expect(formatPriceLevel(4)).toBe('$$$$')
  })

  it('renders level 0 as Gratis', () => {
    expect(formatPriceLevel(0)).toBe('Gratis')
  })
})
