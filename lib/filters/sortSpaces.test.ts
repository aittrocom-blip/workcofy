import { describe, expect, it } from 'vitest'
import { sortSpaces } from './sortSpaces'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceWithDistance>): SpaceWithDistance {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', country: 'pe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null, tiktok_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: null,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true, view_count: 0,
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

  it('sorts by Workcofy Score descending, with nulls last', () => {
    const spaces = [
      makeSpace({ id: 'a', rating: 3.5, review_count: 100 }),
      makeSpace({ id: 'b', rating: 4.9, review_count: 100 }),
      makeSpace({ id: 'c', rating: null, amenities: DEFAULT_AMENITIES }),
    ]
    expect(sortSpaces(spaces, 'workcofy_score').map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by popularity (view_count) descending', () => {
    const spaces = [
      makeSpace({ id: 'a', view_count: 5 }),
      makeSpace({ id: 'b', view_count: 200 }),
      makeSpace({ id: 'c', view_count: 0 }),
    ]
    expect(sortSpaces(spaces, 'popular').map((s) => s.id)).toEqual(['b', 'a', 'c'])
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
