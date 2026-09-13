import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSpacesByIds } from '@/lib/data/spaces'
import { getCoursesByIds } from '@/lib/data/courses'
import { FavoritesList } from '@/components/discovery/FavoritesList'
import { CourseCard } from '@/components/courses/CourseCard'
import { FavoritePlaylistCard } from '@/components/music/FavoritePlaylistCard'
import { isSafeExternalUrl } from '@/lib/url/safeExternalUrl'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mis favoritos | Workcofy',
}

type PlaylistFavoriteRow = {
  playlist_id: string
  name: string | null
  image: string | null
  owner: string | null
  url: string | null
  category_key: string | null
  category_title: string | null
}

export default async function FavoritosPage() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/favoritos')

  const [{ data: favoriteRows }, { data: courseFavoriteRows }, { data: playlistFavoriteRows }] = await Promise.all([
    supabase.from('favorites').select('space_id').eq('user_id', user.id),
    supabase.from('course_favorites').select('course_id').eq('user_id', user.id),
    supabase
      .from('playlist_favorites')
      .select('playlist_id, name, image, owner, url, category_key, category_title')
      .eq('user_id', user.id),
  ])

  const spaceIds = (favoriteRows ?? []).map((row) => row.space_id as string)
  const courseIds = (courseFavoriteRows ?? []).map((row) => row.course_id as string)
  const [spaces, courses] = await Promise.all([getSpacesByIds(spaceIds), getCoursesByIds(courseIds)])

  // Rows saved before migration 0033 have no denormalized name/url — still
  // usable via the playlist id, just grouped under a generic label. `url`
  // is only ever written by the user's own browser client (no server-side
  // validation on that column), so an unsafe scheme here can only be
  // self-XSS — still worth falling back to the canonical Spotify link
  // rather than trusting it as-is.
  const playlists = ((playlistFavoriteRows ?? []) as PlaylistFavoriteRow[]).map((row) => ({
    id: row.playlist_id,
    name: row.name ?? 'Playlist guardada',
    image: row.image,
    owner: row.owner,
    url: isSafeExternalUrl(row.url) ? row.url : `https://open.spotify.com/playlist/${row.playlist_id}`,
    categoryKey: row.category_key ?? 'otras',
    categoryTitle: row.category_title ?? 'Otras playlists',
  }))
  const playlistGroups = new Map<string, { title: string; items: typeof playlists }>()
  for (const playlist of playlists) {
    const group = playlistGroups.get(playlist.categoryKey)
    if (group) group.items.push(playlist)
    else playlistGroups.set(playlist.categoryKey, { title: playlist.categoryTitle, items: [playlist] })
  }

  const isEmpty = spaces.length === 0 && courses.length === 0 && playlists.length === 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Mis favoritos</h1>
      <p className="mt-1 text-gray-500">Tu mural — todo lo que guardaste para volver a encontrarlo rápido.</p>

      {isEmpty && (
        <p className="mt-8 text-sm text-gray-500">
          Todavía no guardaste nada — tocá el corazón en un espacio, un curso o una playlist para agregarlo acá.
        </p>
      )}

      {spaces.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight">Espacios</h2>
          <div className="mt-4">
            <FavoritesList spaces={spaces} />
          </div>
        </section>
      )}

      {courses.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight">Cursos</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {playlistGroups.size > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight">Playlists</h2>
          {Array.from(playlistGroups.values()).map((group) => (
            <div key={group.title} className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{group.title}</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((playlist) => (
                  <FavoritePlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
