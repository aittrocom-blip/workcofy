import { describe, expect, it } from 'vitest'
import { selectNearbyPopularSpaces } from './selectNearbyPopularSpaces'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'
import type { OpeningHours } from '@/lib/hours/openingHours'

const NOW = new Date('2026-09-09T15:00:00Z')

// One "open 24h" period per day of the week, so this counts as open
// regardless of which local day/timezone the test runs in.
const OPEN_ALL_DAY: OpeningHours = {
  periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ open: { day, time: '0000' }, close: null })),
}
const CLOSED_ALL_WEEK: OpeningHours = { periods: [] }

function makeSpace(overrides: Partial<SpaceWithDistance>): SpaceWithDistance {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', country: 'pe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null, tiktok_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: OPEN_ALL_DAY,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true, view_count: 0, like_count: 0,
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
    const result = selectNearbyPopularSpaces(spaces, NOW, 8, 2)
    expect(result.map((s) => s.id)).toEqual(['near-popular', 'near-quiet'])
  })

  it('falls back to plain popularity when no space has a real distance', () => {
    const spaces = [
      makeSpace({ id: 'a', distanceKm: null, view_count: 3 }),
      makeSpace({ id: 'b', distanceKm: null, view_count: 9 }),
    ]
    expect(selectNearbyPopularSpaces(spaces, NOW).map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('respects the limit', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: `s${i}`, distanceKm: i, view_count: i })
    )
    expect(selectNearbyPopularSpaces(spaces, NOW, 3)).toHaveLength(3)
  })

  it('puts open-now spaces ahead of closed ones, even when the closed one is more popular', () => {
    const spaces = [
      makeSpace({ id: 'closed-popular', distanceKm: 1, view_count: 500, opening_hours: CLOSED_ALL_WEEK }),
      makeSpace({ id: 'open-quiet', distanceKm: 1, view_count: 2, opening_hours: OPEN_ALL_DAY }),
    ]
    expect(selectNearbyPopularSpaces(spaces, NOW).map((s) => s.id)).toEqual(['open-quiet', 'closed-popular'])
  })

  it('still fills the strip with closed spaces if not enough are open', () => {
    const spaces = [makeSpace({ id: 'only-closed', distanceKm: 1, opening_hours: CLOSED_ALL_WEEK })]
    expect(selectNearbyPopularSpaces(spaces, NOW)).toHaveLength(1)
  })
})
