import { describe, expect, it } from 'vitest'
import { sortSpaces } from './sortSpaces'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceWithDistance>): SpaceWithDistance {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, rating: null, review_count: null,
    price_level: null, opening_hours: null, photos: null, description: null,
    wifi_available: null, power_outlets: null, laptop_friendly: null, meeting_friendly: null,
    workshop_friendly: null, event_friendly: null, noise_level: null, seating_capacity: null,
    private_rooms: null, outdoor_seating: null, parking: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null, partner_status: 'none',
    data_source: 'mock', active: true,
    distanceKm: null,
    ...overrides,
  }
}

describe('sortSpaces', () => {
  it('sorts by distance ascending, with nulls last', () => {
    const spaces = [
      makeSpace({ id: 'a', distanceKm: 2 }),
      makeSpace({ id: 'b', distanceKm: null }),
      makeSpace({ id: 'c', distanceKm: 0.5 }),
    ]
    expect(sortSpaces(spaces, 'distance').map((s) => s.id)).toEqual(['c', 'a', 'b'])
  })

  it('preserves the incoming order when no space has a real distance', () => {
    // Before the user grants geolocation, DiscoveryView leaves every distanceKm
    // null rather than measuring from the Miraflores fallback, so the 'distance'
    // sort must degrade to a stable no-op instead of shuffling the list.
    const spaces = [
      makeSpace({ id: 'a', distanceKm: null }),
      makeSpace({ id: 'b', distanceKm: null }),
      makeSpace({ id: 'c', distanceKm: null }),
    ]
    expect(sortSpaces(spaces, 'distance').map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by rating descending, with nulls last', () => {
    const spaces = [
      makeSpace({ id: 'a', rating: 4.2 }),
      makeSpace({ id: 'b', rating: 4.8 }),
      makeSpace({ id: 'c', rating: null }),
    ]
    expect(sortSpaces(spaces, 'rating').map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts open-now spaces before closed ones, using an injected clock', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const openHours = { periods: [{ open: { day: now.getDay(), time: '0800' }, close: { day: now.getDay(), time: '2000' } }] }
    const spaces = [
      makeSpace({ id: 'closed', opening_hours: null }),
      makeSpace({ id: 'open', opening_hours: openHours }),
    ]
    expect(sortSpaces(spaces, 'open_now', now).map((s) => s.id)).toEqual(['open', 'closed'])
  })
})
