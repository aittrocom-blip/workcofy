import { describe, expect, it } from 'vitest'
import { selectFeaturedSpaces } from './selectFeaturedSpaces'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceRecord>): SpaceRecord {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: null,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true,
    ...overrides,
  }
}

describe('selectFeaturedSpaces', () => {
  it('orders by Workcofy Score descending', () => {
    const spaces = [
      makeSpace({ id: 'low', rating: 3.5, review_count: 100 }),
      makeSpace({ id: 'high', rating: 4.9, review_count: 100 }),
    ]
    expect(selectFeaturedSpaces(spaces).map((s) => s.id)).toEqual(['high', 'low'])
  })

  it('breaks ties by review_count descending', () => {
    const spaces = [
      makeSpace({ id: 'fewer', workcofy_score: 80, review_count: 10 }),
      makeSpace({ id: 'more', workcofy_score: 80, review_count: 500 }),
    ]
    expect(selectFeaturedSpaces(spaces).map((s) => s.id)).toEqual(['more', 'fewer'])
  })

  it('respects the limit', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: String(i), workcofy_score: i })
    )
    expect(selectFeaturedSpaces(spaces, 3)).toHaveLength(3)
  })

  it('defaults the limit to 6', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: String(i), workcofy_score: i })
    )
    expect(selectFeaturedSpaces(spaces)).toHaveLength(6)
  })
})
