'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/requireAdmin'
import { createSpace } from '@/lib/data/spaces'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { fetchPlaceDetails, fetchPlaceTextSearch } from '@/lib/places/googlePlacesClient'
import { downloadAndUploadPlacePhotos, type GooglePlacePhotoRef } from '@/lib/places/downloadPlacePhotos'
import type { OpeningHours } from '@/lib/hours/openingHours'

export interface NewSpaceInput {
  name: string
  category: string
  district: string
  country: string
  address: string
  /** Set when the admin picked a Google Places result instead of typing everything by hand. */
  googlePlaceId?: string | null
  /** Already fetched client-side (for the preview) — reused here to avoid a second Places call. */
  googlePlaceDetails?: GooglePlaceFields | null
}

export interface CreateSpaceResult {
  ok: boolean
  message?: string
}

// Next.js redacts any error thrown across a Server Action boundary in
// production ("An error occurred in the Server Components render... digest"),
// which is right for genuinely unexpected failures but useless for an
// entirely normal one — e.g. picking a Google Place that's already in
// Workcofy (createSpace()'s own "ya existe un espacio activo..." error).
// Everything expected is caught here and returned as data instead of
// thrown, so the real message always reaches the admin. redirect() still
// has to run outside the try/catch — it works by throwing internally, and
// catching that here would swallow the redirect as if it were an error.
export async function createSpaceAction(input: NewSpaceInput): Promise<CreateSpaceResult> {
  let redirectSlug: string
  try {
    await requireAdmin()

    const name = input.name.trim()
    const district = input.district.trim()
    if (!name) return { ok: false, message: 'El nombre es obligatorio.' }
    if (!district) return { ok: false, message: 'La zona/distrito es obligatoria.' }

    let googleFields: GooglePlaceFields | null = input.googlePlaceDetails ?? null
    if (!googleFields && input.googlePlaceId) {
      googleFields = await getGooglePlaceDetails(input.googlePlaceId)
    }

    const space = await createSpace({
      name,
      category: input.category,
      district,
      country: input.country,
      address: input.address.trim() || googleFields?.address || null,
      latitude: googleFields?.latitude,
      longitude: googleFields?.longitude,
      googlePlaceId: input.googlePlaceId,
      googleMapsUrl: googleFields?.googleMapsUrl,
      phone: googleFields?.phone,
      website: googleFields?.website,
      rating: googleFields?.rating,
      reviewCount: googleFields?.reviewCount,
      priceLevel: googleFields?.priceLevel,
      openingHours: googleFields?.openingHours,
      dataSource: googleFields ? 'google' : 'mock',
    })

    // Photos need the space's final slug (for the storage path), so this can
    // only happen after createSpace() — a failure here shouldn't undo an
    // otherwise-successful creation, just leave it with no photos for now.
    if (googleFields?.photoRefs?.length) {
      const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
      if (apiKey) {
        try {
          const admin = createAdminSupabaseClient()
          const photos = await downloadAndUploadPlacePhotos(admin, googleFields.photoRefs, apiKey, space.slug)
          if (photos.length > 0) {
            await admin.from('spaces').update({ photos }).eq('id', space.id)
          }
        } catch (error) {
          console.warn(`No se pudieron descargar las fotos para "${space.slug}":`, error)
        }
      }
    }

    revalidatePath('/admin/espacios')
    redirectSlug = space.slug
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear el espacio.' }
  }

  redirect(`/admin/espacios/${redirectSlug}`)
}

export interface GooglePlaceCandidate {
  placeId: string
  name: string
  address: string
}

// Free-text search-as-you-type, backed by Google's Places Text Search — up
// to 5 candidates so the admin can pick a real match instead of typing every
// field by hand. Missing key / zero results fail soft (empty list) so manual
// entry always still works; a real API-side rejection (bad key, wrong
// restriction) throws instead — that's a config problem worth surfacing to
// the admin, not something to hide behind a silently empty dropdown.
export async function searchGooglePlaces(query: string): Promise<GooglePlaceCandidate[]> {
  await requireAdmin()

  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) return []

  const body = await fetchPlaceTextSearch(trimmed, apiKey)
  if (body.status === 'ZERO_RESULTS') return []
  if (body.status !== 'OK') {
    throw new Error(`Google Places rechazó la búsqueda (${body.status}): ${body.error_message ?? 'sin detalle'}`)
  }

  return (body.results ?? [])
    .slice(0, 5)
    .map((result: { place_id: string; name: string; formatted_address?: string }) => ({
      placeId: result.place_id,
      name: result.name,
      address: result.formatted_address ?? '',
    }))
}

export interface GooglePlaceFields {
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  website: string | null
  rating: number | null
  reviewCount: number | null
  priceLevel: number | null
  openingHours: OpeningHours | null
  googleMapsUrl: string | null
  photoRefs: GooglePlacePhotoRef[]
}

// Exported so the form can fetch-and-show these fields right after picking
// a suggestion, instead of only applying them invisibly on save.
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceFields> {
  await requireAdmin()
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_SERVER_API_KEY no está configurada.')

  const details = await fetchPlaceDetails(placeId, apiKey)
  return {
    address: details.formatted_address ?? null,
    latitude: details.geometry?.location?.lat ?? null,
    longitude: details.geometry?.location?.lng ?? null,
    phone: details.formatted_phone_number ?? null,
    website: details.website ?? null,
    rating: details.rating ?? null,
    reviewCount: details.user_ratings_total ?? null,
    priceLevel: details.price_level ?? null,
    openingHours: details.opening_hours?.periods ? { periods: details.opening_hours.periods } : null,
    googleMapsUrl: details.url ?? null,
    photoRefs: details.photos ?? [],
  }
}
