import type { OpeningHours } from '@/lib/hours/openingHours'
import type { AmenitiesData } from '@/lib/amenities/types'

export interface SpacePhoto {
  // Lima entries (scripts/seed-google-places.ts) store the raw Google
  // Places photo_reference. Expansion entries (seed-google-places-expansion.ts)
  // download the photo once and store our own Supabase Storage URL instead,
  // since a bare photo_reference can expire and isn't directly renderable.
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
  country: string
  district: string
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  google_maps_url: string | null
  phone: string | null
  website: string | null
  instagram_url: string | null
  tiktok_url: string | null
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
  view_count: number
  special_menu_enabled: boolean
  special_menu_content: string | null
}

export type SpaceWithDistance = SpaceRecord & { distanceKm: number | null }
