'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// Fire-and-forget click tracking for "Escuchar en Spotify" — same
// service-role-only convention as spaces.view_count. Never throws: a lost
// click count isn't worth failing the user's navigation to Spotify over.
export async function logPlaylistClick(playlistId: string): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.rpc('increment_playlist_click', { p_playlist_id: playlistId })
  if (error) {
    console.warn(`Failed to log click for playlist ${playlistId}: ${error.message}`)
  }
}
