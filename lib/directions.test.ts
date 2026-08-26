import { describe, expect, it } from 'vitest'
import { buildDirectionsUrl } from './directions'

describe('buildDirectionsUrl', () => {
  it('uses destination_place_id when a google_place_id is present', () => {
    const url = buildDirectionsUrl({ google_place_id: 'abc123', latitude: -12.1, longitude: -77.03 })
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination_place_id=abc123')
  })

  it('falls back to lat/lng when there is no place id', () => {
    const url = buildDirectionsUrl({ google_place_id: null, latitude: -12.1, longitude: -77.03 })
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-12.1,-77.03')
  })

  it('includes the origin when provided', () => {
    const url = buildDirectionsUrl(
      { google_place_id: 'abc123', latitude: -12.1, longitude: -77.03 },
      { lat: -12.05, lng: -77.02 }
    )
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination_place_id=abc123&origin=-12.05,-77.02'
    )
  })
})
