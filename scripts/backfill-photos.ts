import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { SpacePhoto } from '@/lib/data/spaceTypes'

// Downloads real photos for spaces that only have a Google `photo_reference`
// on file (or no photos at all) and re-hosts them in Supabase Storage. This
// covers the original Lima seed (scripts/seed-google-places.ts), which never
// downloaded photos — only scripts/seed-google-places-expansion.ts does.

const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'
const PLACE_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo'
const PHOTO_BUCKET = 'space-photos'
const MAX_PHOTOS_PER_SPACE = 10

interface SpaceRow {
  id: string
  slug: string
  name: string
  google_place_id: string | null
  photos: SpacePhoto[] | null
}

async function fetchPlacePhotos(placeId: string, apiKey: string) {
  const url = `${PLACE_DETAILS_URL}?place_id=${placeId}&fields=photos&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()
  if (body.status !== 'OK') {
    throw new Error(`Place Details failed for ${placeId}: ${body.status}`)
  }
  return (body.result?.photos ?? []) as { photo_reference: string; width: number; height: number }[]
}

async function downloadPhotos(
  photos: { photo_reference: string; width: number; height: number }[],
  apiKey: string,
  slug: string,
  supabase: ReturnType<typeof createAdminSupabaseClient>
): Promise<SpacePhoto[]> {
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

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_MAPS_SERVER_API_KEY is not set.')
    process.exit(1)
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('spaces')
    .select('id, slug, name, google_place_id, photos')
    .eq('data_source', 'google')
    .not('google_place_id', 'is', null)

  if (error) throw new Error(`Failed to list spaces: ${error.message}`)

  const rows = (data ?? []) as SpaceRow[]
  // Re-run tops spaces up to MAX_PHOTOS_PER_SPACE rather than only touching
  // spaces with zero photos — safe to re-run any time the target count changes,
  // since storage uploads use upsert:true and simply overwrite/extend by index.
  const needsBackfill = rows.filter(
    (row) => (row.photos ?? []).filter((photo) => photo.url).length < MAX_PHOTOS_PER_SPACE
  )

  console.log(`${needsBackfill.length}/${rows.length} spaces need a photo backfill.`)

  let updated = 0
  const skipped: string[] = []

  for (const row of needsBackfill) {
    try {
      const placePhotos = await fetchPlacePhotos(row.google_place_id as string, apiKey)
      if (placePhotos.length === 0) {
        console.warn(`No photos on file with Google for "${row.name}" — skipping.`)
        skipped.push(row.name)
        continue
      }

      const photos = await downloadPhotos(placePhotos, apiKey, row.slug, supabase)
      if (photos.length === 0) {
        skipped.push(row.name)
        continue
      }

      const { error: updateError } = await supabase
        .from('spaces')
        .update({ photos })
        .eq('id', row.id)

      if (updateError) {
        console.warn(`Failed to save photos for "${row.name}": ${updateError.message}`)
        skipped.push(row.name)
        continue
      }

      updated += 1
      console.log(`✓ ${row.name} — ${photos.length} photo(s)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to backfill "${row.name}": ${message}`)
      skipped.push(row.name)
    }
  }

  console.log(`\nBackfilled ${updated}/${needsBackfill.length} spaces.`)
  if (skipped.length > 0) {
    console.warn(`Skipped: ${skipped.join(', ')}`)
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
