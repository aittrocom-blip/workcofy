import { describe, expect, it } from 'vitest'
import { selectNearbyPopularSpaces } from './selectNearbyPopularSpaces'
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
    special_menu_enabled: false, special_menu_content: null,
    distanceKm: null,
    ...overrides,
  }
}

describe('selectNearbyPopularSpaces', () => {
  it('ranks the nearest pool by view_count, not raw distance', () => {
    const spaces = [
      makeSpace({ id: 'far-popular', distanceKm: 5, view_count: 500 }),
      makeSpace({ id: 'near-quiet', distanceKm: 0.5, view_count: 2 }),
      makeSpace({ id: 'near-popular', distanceKm: 1, view_count: 50 }),
    ]
    // Pool the 2 nearest, then rank that pool by popularity.
    const result = selectNearbyPopularSpaces(spaces, 8, 2)
    expect(result.map((s) => s.id)).toEqual(['near-popular', 'near-quiet'])
  })

  it('falls back to plain popularity when no space has a real distance', () => {
    const spaces = [
      makeSpace({ id: 'a', distanceKm: null, view_count: 3 }),
      makeSpace({ id: 'b', distanceKm: null, view_count: 9 }),
    ]
    expect(selectNearbyPopularSpaces(spaces).map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('respects the limit', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: `s${i}`, distanceKm: i, view_count: i })
    )
    expect(selectNearbyPopularSpaces(spaces, 3)).toHaveLength(3)
  })
})
