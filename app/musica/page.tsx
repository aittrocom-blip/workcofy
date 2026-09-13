import { requireUser } from '@/lib/supabase/serverAuth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FALLBACK_PLAYLISTS, getSpotifyPlaylists, type MusicCategory } from '@/lib/spotify'
import MusicGrid from './MusicGrid'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Música | Workcofy' }

export default async function MusicaPage() {
  await requireUser('/musica')
  let categories: Awaited<ReturnType<typeof getSpotifyPlaylists>> = []
  let error = false
  try {
    const supabase = createServerSupabaseClient()
    const { data: catalog } = await supabase.from('music_playlists').select('id, category_key, category_title, name, owner, image_url, spotify_url, sort_order').eq('active', true).order('sort_order', { ascending: true })
    if (catalog?.length) {
      const grouped = new Map<string, MusicCategory>()
      for (const row of catalog) {
        const current: MusicCategory = grouped.get(row.category_key) ?? { key: row.category_key, title: row.category_title, query: '', playlists: [] }
        current.playlists.push({ id: row.id, name: row.name, owner: row.owner, image: row.image_url, url: row.spotify_url })
        grouped.set(row.category_key, current)
      }
      categories = Array.from(grouped.values())
    } else categories = await getSpotifyPlaylists()
  } catch { categories = FALLBACK_PLAYLISTS; error = false }

  const playlistIds = categories.flatMap((category) => category.playlists.map((playlist) => playlist.id))
  const likeCounts: Record<string, number> = {}
  if (playlistIds.length > 0) {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase.from('playlist_stats').select('playlist_id, like_count').in('playlist_id', playlistIds)
    for (const row of data ?? []) likeCounts[row.playlist_id as string] = row.like_count as number
  }

  return <main className="mx-auto max-w-5xl px-4 pb-10 pt-7 md:px-8 md:pt-10"><p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Música</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Pon el ambiente ideal para trabajar</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">Playlists de Spotify seleccionadas automáticamente para concentrarte, leer y trabajar mejor.</p>{error ? <p className="mt-8 rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">No pudimos conectar con Spotify ahora. Intenta de nuevo más tarde.</p> : <MusicGrid categories={categories} likeCounts={likeCounts} />}</main>
}
