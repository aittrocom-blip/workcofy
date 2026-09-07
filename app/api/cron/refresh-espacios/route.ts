import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/cron/verifyCronSecret'
import { refreshEspacios } from '@/lib/places/refreshEspacios'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Monthly cron (see vercel.json) — refreshes only rating/reviews/hours/price/
// contact info from Google Places for spaces we already resolved; never
// touches Workcofy-curated fields (see lib/places/refreshEspacios.ts). Kept
// monthly rather than daily because Google Places API is billed per call,
// unlike the free GetOnBoard ingestion.
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_MAPS_SERVER_API_KEY is not set' }, { status: 500 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const result = await refreshEspacios(supabase, apiKey)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('refresh-espacios cron failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
