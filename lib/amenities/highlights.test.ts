import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, type AmenitiesData } from './types'
import { topAmenityHighlights } from './highlights'

function amenities(overrides: Partial<AmenitiesData>): AmenitiesData {
  return { ...DEFAULT_AMENITIES, ...overrides }
}

describe('topAmenityHighlights', () => {
  it('returns nothing for a space with only the table-stakes defaults', () => {
    expect(topAmenityHighlights(DEFAULT_AMENITIES)).toEqual([])
  })

  it('puts ambiente first when known', () => {
    const result = topAmenityHighlights(
      amenities({
        ambiente: 'tranquilo',
        para_trabajar: { ...DEFAULT_AMENITIES.para_trabajar, wifi_rapido: true },
      })
    )
    expect(result[0]).toBe('Tranquilo')
    expect(result).toContain('WiFi rápido')
  })

  it('ignores false and unknown amenities', () => {
    const result = topAmenityHighlights(
      amenities({
        para_trabajar: { ...DEFAULT_AMENITIES.para_trabajar, wifi_rapido: false, enchufes: null },
      })
    )
    expect(result).toEqual([])
  })

  it('caps at max and follows priority order', () => {
    const result = topAmenityHighlights(
      amenities({
        para_trabajar: { ...DEFAULT_AMENITIES.para_trabajar, wifi_rapido: true, enchufes: true, mesas_comodas: true },
        para_llamadas: { ...DEFAULT_AMENITIES.para_llamadas, zona_tranquila: true },
      }),
      3
    )
    expect(result).toEqual(['WiFi rápido', 'Zona tranquila', 'Enchufes'])
  })
})
