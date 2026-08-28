import { describe, expect, it } from 'vitest'
import { groupedAmenityEntries } from './groupedAmenityEntries'
import { DEFAULT_AMENITIES } from './types'
import type { AmenitiesData } from './types'

describe('groupedAmenityEntries', () => {
  it('produces one entry group per amenity group, in schema order', () => {
    const groups = groupedAmenityEntries(DEFAULT_AMENITIES)
    expect(groups.map((g) => g.groupKey)).toEqual(['para_trabajar', 'para_llamadas', 'servicios'])
  })

  it('labels each group and each entry', () => {
    const groups = groupedAmenityEntries(DEFAULT_AMENITIES)
    expect(groups[0].groupLabel).toBe('Para trabajar')
    expect(groups[0].entries).toContainEqual({ key: 'wifi', label: 'WiFi', value: true })
  })

  it('carries through known values unchanged', () => {
    const amenities = {
      ...DEFAULT_AMENITIES,
      para_trabajar: { ...DEFAULT_AMENITIES.para_trabajar, wifi: true },
    }
    const groups = groupedAmenityEntries(amenities)
    expect(groups[0].entries).toContainEqual({ key: 'wifi', label: 'WiFi', value: true })
  })

  it('treats an empty object as three full groups (defaults filled in), not an empty result', () => {
    const groups = groupedAmenityEntries({} as AmenitiesData)
    expect(groups.map((g) => g.groupKey)).toEqual(['para_trabajar', 'para_llamadas', 'servicios'])
    // wifi, cafe, agua, and banos default to true (table-stakes); everything else is unknown.
    const assumedTrue = new Set(['wifi', 'cafe', 'agua', 'banos'])
    const otherEntries = groups.flatMap((g) => g.entries).filter((e) => !assumedTrue.has(e.key))
    expect(otherEntries.every((e) => e.value === null)).toBe(true)
  })
})
