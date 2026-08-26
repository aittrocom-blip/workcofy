import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { generateSpaceSlug } from '@/lib/slug'
import { DISTRICTS, districtLabel } from '@/lib/districts'
import { SEED_TARGETS, type SeedTarget } from '@/lib/places/seedTargets'
import type { SeedSpaceInput } from '@/lib/places/types'
import type { OpeningPeriod } from '@/lib/hours/openingHours'

const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

async function findPlaceId(target: SeedTarget, apiKey: string): Promise<string | null> {
  const label = districtLabel(target.district)
  const query = `${target.name}, ${label}, Lima, Peru`
  const url = `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK' || !body.results?.length) {
    console.warn(`No Google Place match for "${target.name}" (${label}): ${body.status}`)
    return null
  }

  const bestMatch = body.results.find((result: { formatted_address?: string }) =>
    result.formatted_address?.toLowerCase().includes(label.toLowerCase())
  )

  if (!bestMatch) {
    console.warn(
      `Found results for "${target.name}" but none confirm a ${label} address — skipping for manual review.`
    )
    return null
  }

  return bestMatch.place_id
}

async function fetchPlaceDetails(placeId: string, apiKey: string) {
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

interface GooglePlaceDetails {
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

function toSeedInput(target: SeedTarget, placeId: string, details: GooglePlaceDetails): SeedSpaceInput {
  const districtSlug = DISTRICTS.find((d) => d.value === target.district)!.slug
  const photos = details.photos?.length
    ? details.photos.map((photo) => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      }))
    : null

  return {
    name: target.name,
    slug: generateSpaceSlug(target.name, districtSlug),
    category: 'work_cafe',
    district: target.district,
    address: details.formatted_address ?? null,
    latitude: details.geometry?.location?.lat ?? null,
    longitude: details.geometry?.location?.lng ?? null,
    google_place_id: placeId,
    google_maps_url: details.url ?? null,
    phone: details.formatted_phone_number ?? null,
    website: details.website ?? null,
    rating: details.rating ?? null,
    review_count: details.user_ratings_total ?? null,
    price_level: details.price_level ?? null,
    opening_hours: details.opening_hours?.periods
      ? { periods: details.opening_hours.periods }
      : null,
    photos,
    description: null,
    data_source: 'google',
  }
}

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error(
      'GOOGLE_MAPS_SERVER_API_KEY is not set. This script requires a real Google Maps Platform key ' +
        'with Places API enabled — see docs/superpowers/specs/2026-08-26-workcofy-core-discovery-design.md §12.'
    )
    process.exit(1)
  }

  const supabase = createAdminSupabaseClient()
  const resolved: SeedSpaceInput[] = []
  const skipped: string[] = []

  for (const target of SEED_TARGETS) {
    // One failing target (rate limit, transient network error, unexpected Places
    // status) must never discard every space already resolved in this run.
    try {
      const placeId = await findPlaceId(target, apiKey)
      if (!placeId) {
        skipped.push(target.name)
        continue
      }
      const details = await fetchPlaceDetails(placeId, apiKey)
      resolved.push(toSeedInput(target, placeId, details))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to resolve "${target.name}" — skipping: ${message}`)
      skipped.push(target.name)
    }
  }

  // Upsert one record at a time rather than as a single batch: two SEED_TARGETS
  // can be different branches of the same business in the same district, which
  // findPlaceId cannot tell apart, so both may resolve to the same Google Place.
  // The `google_place_id` unique constraint then rejects the second row — as a
  // batch that would sink every other record with it.
  let seeded = 0
  for (const record of resolved) {
    const { error } = await supabase.from('spaces').upsert(record, { onConflict: 'slug' })
    if (error) {
      console.warn(`Failed to upsert "${record.name}" — skipping: ${error.message}`)
      skipped.push(record.name)
      continue
    }
    seeded += 1
  }

  console.log(`Resolved and seeded ${seeded}/${SEED_TARGETS.length} spaces.`)
  if (skipped.length > 0) {
    console.warn(`Skipped (no confident match, resolve manually): ${skipped.join(', ')}`)
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
