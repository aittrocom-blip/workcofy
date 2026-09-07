import { describe, expect, it } from 'vitest'
import { toSpaceRefreshUpdate } from './refreshEspacios'
import type { GooglePlaceDetails } from './googlePlacesClient'

describe('toSpaceRefreshUpdate', () => {
  it('maps only the fields that are safe to auto-refresh', () => {
    const details: GooglePlaceDetails = {
      formatted_phone_number: '+51 999 999 999',
      website: 'https://acme.pe',
      rating: 4.6,
      user_ratings_total: 128,
      price_level: 2,
      opening_hours: { periods: [] },
      url: 'https://maps.google.com/?cid=1',
      formatted_address: 'Av. Siempre Viva 123',
      geometry: { location: { lat: -12.1, lng: -77.03 } },
      photos: [{ photo_reference: 'abc', width: 100, height: 100 }],
    }
    expect(toSpaceRefreshUpdate(details)).toEqual({
      phone: '+51 999 999 999',
      website: 'https://acme.pe',
      rating: 4.6,
      review_count: 128,
      price_level: 2,
      opening_hours: { periods: [] },
      google_maps_url: 'https://maps.google.com/?cid=1',
    })
  })

  it('never includes curated or identity fields, even by omission-to-null', () => {
    const update = toSpaceRefreshUpdate({})
    const forbiddenKeys = [
      'name', 'slug', 'category', 'district', 'address', 'latitude', 'longitude',
      'photos', 'amenities', 'verified', 'verified_amenities', 'workcofy_score',
      'workcofy_notes', 'partner_status', 'active', 'view_count', 'like_count',
    ]
    for (const key of forbiddenKeys) expect(update).not.toHaveProperty(key)
  })

  it('maps missing fields to null rather than leaving them undefined', () => {
    expect(toSpaceRefreshUpdate({})).toEqual({
      phone: null,
      website: null,
      rating: null,
      review_count: null,
      price_level: null,
      opening_hours: null,
      google_maps_url: null,
    })
  })
})
