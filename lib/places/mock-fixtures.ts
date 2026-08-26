/**
 * MOCK / DEV-ONLY DATA. Coordinates are approximate placeholders scattered
 * around each district's centroid — NOT real addresses — so the map/list/
 * distance features are testable locally before a Google Maps Platform key
 * exists. Never used to seed a production database; replaced entirely by
 * scripts/seed-google-places.ts once a real key is available.
 */
import { generateSpaceSlug } from '@/lib/slug'
import { DISTRICTS, DISTRICT_CENTROIDS } from '@/lib/districts'
import { SEED_TARGETS } from '@/lib/places/seedTargets'
import type { SeedSpaceInput } from '@/lib/places/types'
import type { OpeningHours } from '@/lib/hours/openingHours'

function offsetCoordinate(base: { lat: number; lng: number }, index: number) {
  const angle = (index * 47) % 360
  const radiusDeg = 0.002 + (index % 5) * 0.0008
  const rad = (angle * Math.PI) / 180
  return {
    lat: base.lat + radiusDeg * Math.cos(rad),
    lng: base.lng + radiusDeg * Math.sin(rad),
  }
}

const MOCK_OPENING_HOURS: OpeningHours = {
  periods: [1, 2, 3, 4, 5, 6].map((day) => ({
    open: { day, time: '0800' },
    close: { day, time: day === 6 ? '1800' : '2000' },
  })),
}

export function buildMockSpaceFixtures(): SeedSpaceInput[] {
  return SEED_TARGETS.map((target, index) => {
    const districtSlug = DISTRICTS.find((d) => d.value === target.district)!.slug
    const coordinate = offsetCoordinate(DISTRICT_CENTROIDS[target.district], index)

    return {
      name: target.name,
      slug: generateSpaceSlug(target.name, districtSlug),
      category: 'work_cafe',
      district: target.district,
      address: null,
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      google_place_id: null,
      google_maps_url: null,
      phone: null,
      website: null,
      rating: 4.5,
      review_count: 50 + index * 3,
      price_level: 2,
      opening_hours: MOCK_OPENING_HOURS,
      photos: null,
      description: null,
      data_source: 'mock',
    }
  })
}
