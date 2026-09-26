import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/cron/verifyCronSecret'
import { refreshMusicPlaylistsCache } from '@/lib/music/refreshCache'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Manual trigger — the scheduled run lives inside /api/cron/seed-opportunities
// (Mondays) because Vercel Hobby caps how many cron entries a project can
// have. Replaces music_playlists' contents with fresh Spotify search
// results, category by category. /musica reads that table directly, so a
// visitor's page load never calls Spotify itself.
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminSupabaseClient()
    const result = await refreshMusicPlaylistsCache(admin)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('refresh-music cron failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
