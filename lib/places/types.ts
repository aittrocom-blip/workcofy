import type { OpeningHours } from '@/lib/hours/openingHours'
import type { SpacePhoto } from '@/lib/data/spaceTypes'
import type { DistrictValue } from '@/lib/districts'

export interface SeedSpaceInput {
  name: string
  slug: string
  category: 'cafe' | 'work_cafe'
  district: DistrictValue
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  google_maps_url: string | null
  phone: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  photos: SpacePhoto[] | null
  description: string | null
  data_source: 'mock' | 'google'
}
