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

// Downloaded in parallel, not one at a time — sequentially, 10 photos (each
// a Google fetch + a Supabase Storage upload) routinely took 20-30s+ and blew
// past the caller's serverless function time limit (see maxDuration on
// app/admin/espacios/nuevo/actions.ts), which killed the whole request mid-
// flight with a generic 500 even though the space row itself had already
// been created. Promise.allSettled keeps the "one bad photo doesn't lose the
// others" guarantee while running them concurrently; order is restored from
// photoRefs afterward so photo indexes (and their storage paths) stay stable.
export async function downloadAndUploadPlacePhotos(
  supabase: SupabaseClient,
  photoRefs: GooglePlacePhotoRef[],
  apiKey: string,
  slug: string
): Promise<SpacePhoto[]> {
  const picked = photoRefs.slice(0, MAX_PHOTOS_PER_SPACE)

  const results = await Promise.allSettled(
    picked.map(async (photo, i): Promise<SpacePhoto> => {
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
      return { url: data.publicUrl, width: photo.width, height: photo.height }
    })
  )

  const uploaded: SpacePhoto[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      uploaded.push(result.value)
    } else {
      // One failed photo (rate limit, transient network error) shouldn't
      // discard every other photo already downloaded for this space.
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
      console.warn(`Photo ${i} failed for "${slug}": ${message}`)
    }
  })
  return uploaded
}
