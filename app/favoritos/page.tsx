import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSpacesByIds } from '@/lib/data/spaces'
import { FavoritesList } from '@/components/discovery/FavoritesList'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mis favoritos | Workcofy',
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

  const { data: favoriteRows } = await supabase.from('favorites').select('space_id').eq('user_id', user.id)
  const spaceIds = (favoriteRows ?? []).map((row) => row.space_id as string)
  const spaces = await getSpacesByIds(spaceIds)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Mis favoritos</h1>
      <p className="mt-1 text-gray-500">Espacios que guardaste para volver a encontrarlos rápido.</p>

      {spaces.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          Todavía no guardaste ningún espacio — tocá el corazón en cualquier ficha para agregarlo acá.
        </p>
      ) : (
        <div className="mt-8">
          <FavoritesList spaces={spaces} />
        </div>
      )}
    </div>
  )
}
