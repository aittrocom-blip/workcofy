import type { SupabaseClient } from '@supabase/supabase-js'
import type { SpacePhoto } from '@/lib/data/spaceTypes'

// A bare Google `photo_reference` isn't a renderable URL (it expires and
// needs an API key to resolve), and every photo-consuming component in this
// codebase only reads `photo.url` — so photos always get downloaded once
// and re-hosted in Supabase Storage instead of storing the reference as-is.
// Extracted from scripts/backfill-photos.ts so the admin "Agregar espacio"
// flow (app/admin/espacios/nuevo/actions.ts) can do the same thing at
// create time instead of waiting for a manual backfill run.
// Takes the Supabase client rather than constructing one: lib/supabase/admin.ts
// (`import 'server-only'`) only resolves inside Next's bundler, so a
// standalone script (like scripts/backfill-photos.ts) needs to pass its own
// service-role client in instead.
const PLACE_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo'
const PHOTO_BUCKET = 'space-photos'
const MAX_PHOTOS_PER_SPACE = 10

export interface GooglePlacePhotoRef {
  photo_reference: string
  width: number
  height: number
}

export async function downloadAndUploadPlacePhotos(
  supabase: SupabaseClient,
  photoRefs: GooglePlacePhotoRef[],
  apiKey: string,
  slug: string
): Promise<SpacePhoto[]> {
  const picked = photoRefs.slice(0, MAX_PHOTOS_PER_SPACE)
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
      // One failed photo (rate limit, transient network error) shouldn't
      // discard every other photo already downloaded for this space.
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Photo ${i} failed for "${slug}": ${message}`)
    }
  }
  return uploaded
}
