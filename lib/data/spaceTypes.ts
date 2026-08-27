import type { OpeningHours } from '@/lib/hours/openingHours'

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
  district: string
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
  wifi_available: boolean | null
  power_outlets: boolean | null
  laptop_friendly: boolean | null
  meeting_friendly: boolean | null
  workshop_friendly: boolean | null
  event_friendly: boolean | null
  noise_level: string | null
  seating_capacity: number | null
  private_rooms: boolean | null
  outdoor_seating: boolean | null
  parking: boolean | null
  recommended_stay_minutes: number | null
  workcofy_score: number | null
  workcofy_notes: string | null
  partner_status: string
  /** Provenance of this row: fabricated dev fixtures vs. real Google Places data. */
  data_source: 'mock' | 'google'
  active: boolean
}

export type SpaceWithDistance = SpaceRecord & { distanceKm: number | null }
