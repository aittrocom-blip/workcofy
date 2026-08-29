import { describe, expect, it } from 'vitest'
import { computeWorkcofyScore } from './workcofyScore'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { AmenitiesData } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceRecord>): SpaceRecord {
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
    ...overrides,
  }
}

describe('computeWorkcofyScore', () => {
  it('returns null when there is no rating and no known amenity', () => {
    expect(computeWorkcofyScore(makeSpace({}))).toBeNull()
  })

  it('uses the manual override when workcofy_score is set, ignoring everything else', () => {
    const space = makeSpace({ rating: 1, review_count: 1, workcofy_score: 77 })
    expect(computeWorkcofyScore(space)).toBe(77)
  })

  it('scores from rating alone at full weight when no amenity is known (the common case at launch)', () => {
    const space = makeSpace({ rating: 4.6, review_count: 300 })
    const score = computeWorkcofyScore(space)
    expect(score).not.toBeNull()
    // 4.6/5 * 100 = 92, high confidence at 300 reviews, so it should land close to 92, not near 60.
    expect(score as number).toBeGreaterThan(85)
  })

  it('discounts a high rating with very few reviews toward the midpoint', () => {
    const fewReviews = makeSpace({ rating: 5, review_count: 1 })
    const manyReviews = makeSpace({ rating: 5, review_count: 300 })
    const scoreFew = computeWorkcofyScore(fewReviews) as number
    const scoreMany = computeWorkcofyScore(manyReviews) as number
    expect(scoreFew).toBeLessThan(scoreMany)
  })

  it('scores from amenities alone when there is no rating', () => {
    const space = makeSpace({
      amenities: { ...DEFAULT_AMENITIES, para_trabajar: { wifi: true, wifi_rapido: null, enchufes: true, mesas_comodas: null, iluminacion: null, aire_acondicionado: null } },
    })
    expect(computeWorkcofyScore(space)).toBe(100)
  })

  it('blends both components when both are known', () => {
    const ratingOnly = makeSpace({ rating: 4.6, review_count: 300 })
    const both = makeSpace({
      rating: 4.6, review_count: 300,
      amenities: { ...DEFAULT_AMENITIES, para_trabajar: { wifi: false, wifi_rapido: false, enchufes: false, mesas_comodas: false, iluminacion: false, aire_acondicionado: false } },
    })
    const scoreRatingOnly = computeWorkcofyScore(ratingOnly) as number
    const scoreBoth = computeWorkcofyScore(both) as number
    // All amenities false pulls the blended score down from the rating-only score.
    expect(scoreBoth).toBeLessThan(scoreRatingOnly)
  })

  it('does not throw when amenities is the raw {} shape real DB rows have before normalization', () => {
    const space = makeSpace({ rating: 4.6, review_count: 300, amenities: {} as AmenitiesData })
    expect(() => computeWorkcofyScore(space)).not.toThrow()
    expect(computeWorkcofyScore(space)).not.toBeNull()
  })
})
