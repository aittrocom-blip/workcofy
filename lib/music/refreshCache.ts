import type { SupabaseClient } from '@supabase/supabase-js'
import { getSpotifyPlaylists } from '@/lib/spotify'

export interface RefreshMusicResult {
  categories: number
  playlists: number
}

// Pulls fresh results from Spotify and replaces music_playlists' contents
// per category — called only from app/api/cron/refresh-music (service-role
// client), never from a page render. /musica (app/musica/page.tsx) reads
// this table directly, so a visitor's page load never calls Spotify.
//
// Table shape is 0037_music_catalog.sql's, not reinvented here: `id` is the
// bare Spotify playlist id (primary key — one row per playlist, so the same
// playlist can't sit in two categories at once), `image_url`/`spotify_url`
// name the URL columns, and `active` gates the public read policy.
export async function refreshMusicPlaylistsCache(admin: SupabaseClient): Promise<RefreshMusicResult> {
  const categories = await getSpotifyPlaylists()
  let playlistCount = 0

  for (const category of categories) {
    const freshIds = category.playlists.map((playlist) => playlist.id)

    // Drop rows for this category that a fresh search no longer returned
    // (a playlist can quietly disappear from Spotify's own results) before
    // upserting — 'in' with an empty array is invalid, so an empty result
    // clears the whole category instead.
    let deleteQuery = admin.from('music_playlists').delete().eq('category_key', category.key)
    deleteQuery = freshIds.length > 0 ? deleteQuery.not('id', 'in', `(${freshIds.join(',')})`) : deleteQuery
    const { error: deleteError } = await deleteQuery
    if (deleteError) throw new Error(`Failed to clear ${category.key}: ${deleteError.message}`)

    if (freshIds.length === 0) continue

    const rows = category.playlists.map((playlist, index) => ({
      id: playlist.id,
      category_key: category.key,
      category_title: category.title,
      name: playlist.name,
      owner: playlist.owner,
      image_url: playlist.image,
      spotify_url: playlist.url,
      sort_order: index,
      active: true,
      updated_at: new Date().toISOString(),
    }))
    const { error: upsertError } = await admin.from('music_playlists').upsert(rows, { onConflict: 'id' })
    if (upsertError) throw new Error(`Failed to save ${category.key}: ${upsertError.message}`)
    playlistCount += rows.length
  }

  return { categories: categories.length, playlists: playlistCount }
}
