import type { OpeningPeriod } from '@/lib/hours/openingHours'

const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

export interface GooglePlaceDetails {
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  opening_hours?: { periods?: OpeningPeriod[] }
  photos?: { photo_reference: string; width: number; height: number }[]
  url?: string
}

// Shared by scripts/seed-google-places.ts (new spaces, all fields) and
// lib/places/refreshEspacios.ts (existing spaces, a safe subset of fields).
export async function fetchPlaceTextSearch(query: string, apiKey: string) {
  const url = `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)
  return response.json()
}

export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails> {
  const fields = [
    'name', 'formatted_address', 'geometry', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total', 'price_level',
    'opening_hours', 'photos', 'url',
  ].join(',')
  const url = `${PLACE_DETAILS_URL}?place_id=${placeId}&fields=${fields}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK') {
    throw new Error(`Place Details failed for ${placeId}: ${body.status}`)
  }
  return body.result
}
