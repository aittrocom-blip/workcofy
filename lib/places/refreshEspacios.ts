import type { SupabaseClient } from '@supabase/supabase-js'
import type { OpeningHours } from '@/lib/hours/openingHours'
import { fetchPlaceDetails, type GooglePlaceDetails } from './googlePlacesClient'

export interface SpaceRefreshUpdate {
  phone: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  google_maps_url: string | null
}

// The only fields a monthly refresh is allowed to touch: things Google's own
// listing can change over time. Never the space's identity (name, slug,
// category, district, address, coordinates), never its photos, and never
// anything Workcofy curates by hand (amenities, verified*, workcofy_score,
// workcofy_notes, partner_status) or tracks itself (active, view_count,
// like_count) — a scraper must not be able to silently undo human curation.
export function toSpaceRefreshUpdate(details: GooglePlaceDetails): SpaceRefreshUpdate {
  return {
    phone: details.formatted_phone_number ?? null,
    website: details.website ?? null,
    rating: details.rating ?? null,
    review_count: details.user_ratings_total ?? null,
    price_level: details.price_level ?? null,
    opening_hours: details.opening_hours?.periods ? { periods: details.opening_hours.periods } : null,
    google_maps_url: details.url ?? null,
  }
}

export interface RefreshEspaciosResult {
  total: number
  refreshed: number
  failed: number
}

const CONCURRENCY = 5

// Shared by scripts/refresh-espacios.ts (manual runs) and the monthly cron
// route (app/api/cron/refresh-espacios/route.ts). Only touches spaces that
// already have a google_place_id — spaces without one were never resolved
// from Google in the first place and are left alone.
export async function refreshEspacios(supabase: SupabaseClient, apiKey: string): Promise<RefreshEspaciosResult> {
  const { data: spaces, error } = await supabase
    .from('spaces')
    .select('id, google_place_id')
    .eq('active', true)
    .not('google_place_id', 'is', null)
  if (error) throw new Error(`Failed to list spaces to refresh: ${error.message}`)

  let refreshed = 0
  let failed = 0
  const rows = (spaces ?? []) as { id: string; google_place_id: string }[]

  for (let index = 0; index < rows.length; index += CONCURRENCY) {
    const batch = rows.slice(index, index + CONCURRENCY)
    await Promise.all(
      batch.map(async (space) => {
        try {
          const details = await fetchPlaceDetails(space.google_place_id, apiKey)
          const update = toSpaceRefreshUpdate(details)
          const { error: updateError } = await supabase.from('spaces').update(update).eq('id', space.id)
          if (updateError) throw new Error(updateError.message)
          refreshed += 1
        } catch (refreshError) {
          console.warn(`Failed to refresh space ${space.id}:`, refreshError)
          failed += 1
        }
      })
    )
  }

  return { total: rows.length, refreshed, failed }
}
