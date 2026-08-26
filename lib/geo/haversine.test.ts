import { describe, expect, it } from 'vitest'
import { haversineDistanceKm, formatDistanceKm } from './haversine'

describe('haversineDistanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceKm({ lat: -12.12, lng: -77.03 }, { lat: -12.12, lng: -77.03 })).toBe(0)
  })

  it('matches the known ~111.2km per degree of longitude at the equator', () => {
    const km = haversineDistanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })
    expect(km).toBeCloseTo(111.2, 0)
  })
})

describe('formatDistanceKm', () => {
  it('formats to one decimal with a km suffix', () => {
    expect(formatDistanceKm(1.234)).toBe('1.2 km')
  })
})
