import type { OpeningHours } from '@/lib/hours/openingHours'
import type { AmenitiesData } from '@/lib/amenities/types'

export interface SpacePhoto {
  photo_reference?: string
  url?: string
  width: number
  height: number
}

export interface SpaceRecord {
  id: string
  name: string
  slug: string
  category: string
  district: string
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  google_maps_url: string | null
  phone: string | null
  website: string | null
  instagram_url: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  photos: SpacePhoto[] | null
  description: string | null
  amenities: AmenitiesData
  noise_level: string | null
  seating_capacity: number | null
  recommended_stay_minutes: number | null
  workcofy_score: number | null
  workcofy_notes: string | null
  verified: boolean
  verified_at: string | null
  verified_amenities: string[]
  partner_status: string
  /** Provenance of this row: fabricated dev fixtures vs. real Google Places data. */
  data_source: 'mock' | 'google'
  active: boolean
}

export type SpaceWithDistance = SpaceRecord & { distanceKm: number | null }
