import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { generateSpaceSlug } from '@/lib/slug'
import { normalizeDistrict } from '@/lib/geo/normalizeDistrict'
import { LEGACY_TARGETS, type LegacyTarget } from '@/lib/places/legacyTargets'
import type { SpacePhoto } from '@/lib/data/spaceTypes'
import type { OpeningPeriod } from '@/lib/hours/openingHours'

const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'
const PLACE_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo'
const PHOTO_BUCKET = 'space-photos'
const MAX_PHOTOS_PER_SPACE = 10

const COUNTRY_LABEL: Record<LegacyTarget['country'], string> = { pe: 'Perú', cl: 'Chile' }

async function findPlaceId(target: LegacyTarget, apiKey: string): Promise<string | null> {
  const countryLabel = COUNTRY_LABEL[target.country]
  const query = `${target.name}, ${target.localidad}, ${countryLabel}`
  const url = `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK' || !body.results?.length) {
    console.warn(`No Google Place match for "${target.name}" (${target.localidad}, ${countryLabel}): ${body.status}`)
    return null
  }

  const bestMatch = body.results.find((result: { formatted_address?: string }) =>
    result.formatted_address?.toLowerCase().includes(target.localidad.toLowerCase())
  )

  if (!bestMatch) {
    console.warn(
      `Found results for "${target.name}" but none confirm a ${target.localidad} address — skipping for manual review.`
    )
    return null
  }

  return bestMatch.place_id
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

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails> {
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

// Google's photo_reference isn't directly renderable and can expire, so we
// download the bytes once and re-host them in our own Storage bucket.
async function downloadPhotos(
  photos: GooglePlaceDetails['photos'],
  apiKey: string,
  slug: string,
  supabase: ReturnType<typeof createAdminSupabaseClient>
): Promise<SpacePhoto[]> {
  if (!photos?.length) return []
  const picked = photos.slice(0, MAX_PHOTOS_PER_SPACE)
  const uploaded: SpacePhoto[] = []

  for (let i = 0; i < picked.length; i++) {
    const photo = picked[i]
    try {
      const photoUrl = `${PLACE_PHOTO_URL}?maxwidth=1200&photoreference=${photo.photo_reference}&key=${apiKey}`
      const response = await fetch(photoUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      const path = `${slug}/${i}.jpg`

      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
      uploaded.push({ url: data.publicUrl, width: photo.width, height: photo.height })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`  Photo ${i} failed for "${slug}": ${message}`)
    }
  }
  return uploaded
}

interface ExpansionSeedInput {
  name: string
  slug: string
  category: 'cafe' | 'work_cafe'
  country: LegacyTarget['country']
  district: string
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string
  google_maps_url: string | null
  phone: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: { periods: OpeningPeriod[] } | null
  photos: SpacePhoto[] | null
  description: null
  data_source: 'google'
}

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_MAPS_SERVER_API_KEY is not set. This script requires a real Google Maps Platform key with Places API enabled.')
    process.exit(1)
  }

  const supabase = createAdminSupabaseClient()
  const resolved: ExpansionSeedInput[] = []
  const skipped: string[] = []

  for (const target of LEGACY_TARGETS) {
    try {
      const placeId = await findPlaceId(target, apiKey)
      if (!placeId) {
        skipped.push(target.name)
        continue
      }
      const details = await fetchPlaceDetails(placeId, apiKey)
      const districtSlug = normalizeDistrict(target.localidad)
      const slug = generateSpaceSlug(target.name, `${target.country}-${target.localidad}`)
      const photos = await downloadPhotos(details.photos, apiKey, slug, supabase)

      // Only the Banco Santander-branded "Work/Café" locations are the
      // work_cafe category — every other legacy target is a regular café.
      const category = target.name.toLowerCase().includes('santander') ? 'work_cafe' : 'cafe'

      resolved.push({
        name: target.name,
        slug,
        category,
        country: target.country,
        district: districtSlug,
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
        opening_hours: details.opening_hours?.periods ? { periods: details.opening_hours.periods } : null,
        photos: photos.length ? photos : null,
        description: null,
        data_source: 'google',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to resolve "${target.name}" — skipping: ${message}`)
      skipped.push(target.name)
    }
  }

  let seeded = 0
  for (const record of resolved) {
    const { data, error } = await supabase
      .from('spaces')
      .upsert(record, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error || !data) {
      console.warn(`Failed to upsert "${record.name}" — skipping: ${error?.message}`)
      skipped.push(record.name)
      continue
    }
    seeded += 1

    // Placeholder row so WhatsApp/email can be filled in by hand later —
    // never touched by the public anon key (see 0002_expansion_geo.sql).
    const { error: contactError } = await supabase
      .from('space_internal_contacts')
      .upsert({ space_id: data.id }, { onConflict: 'space_id', ignoreDuplicates: true })
    if (contactError) {
      console.warn(`  Could not create internal contact row for "${record.name}": ${contactError.message}`)
    }
  }

  console.log(`Resolved and seeded ${seeded}/${LEGACY_TARGETS.length} spaces.`)
  if (skipped.length > 0) {
    console.warn(`Skipped (no confident match, resolve manually): ${skipped.join(', ')}`)
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
