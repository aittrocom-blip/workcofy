'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export interface PlaylistFavoriteMeta {
  id: string
  name: string
  image: string | null
  owner: string | null
  url: string
  categoryKey: string
  categoryTitle: string
}

interface PlaylistFavoritesContextValue {
  loggedIn: boolean
  isFavorited: (playlistId: string) => boolean
  toggleFavorite: (playlist: PlaylistFavoriteMeta) => Promise<boolean>
}

const PlaylistFavoritesContext = createContext<PlaylistFavoritesContextValue | null>(null)

// Saved-for-later Spotify playlists — mirrors FavoritesProvider (spaces)
// exactly, over its own playlist_favorites table.
export function PlaylistFavoritesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadFavorites(uid: string | null) {
      if (!uid) {
        setFavoriteIds(new Set())
        return
      }
      const { data } = await supabase.from('playlist_favorites').select('playlist_id').eq('user_id', uid)
      setFavoriteIds(new Set((data ?? []).map((row) => row.playlist_id as string)))
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadFavorites(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      loadFavorites(uid)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isFavorited = useCallback((playlistId: string) => favoriteIds.has(playlistId), [favoriteIds])

  const toggleFavorite = useCallback(
    async (playlist: PlaylistFavoriteMeta) => {
      if (!userId) throw new Error('No hay sesión activa.')
      const supabase = createBrowserSupabaseClient()
      const alreadyFavorited = favoriteIds.has(playlist.id)

      setFavoriteIds((current) => {
        const next = new Set(current)
        if (alreadyFavorited) next.delete(playlist.id)
        else next.add(playlist.id)
        return next
      })

      // Denormalized at save time — see migration 0033: playlists aren't
      // rows we own, so /favoritos has nothing else to render them from.
      const { error } = alreadyFavorited
        ? await supabase.from('playlist_favorites').delete().eq('user_id', userId).eq('playlist_id', playlist.id)
        : await supabase.from('playlist_favorites').insert({
            user_id: userId,
            playlist_id: playlist.id,
            name: playlist.name,
            image: playlist.image,
            owner: playlist.owner,
            url: playlist.url,
            category_key: playlist.categoryKey,
            category_title: playlist.categoryTitle,
          })
      if (error) {
        setFavoriteIds((current) => {
          const next = new Set(current)
          if (alreadyFavorited) next.add(playlist.id)
          else next.delete(playlist.id)
          return next
        })
        throw error
      }
      return !alreadyFavorited
    },
    [userId, favoriteIds]
  )

  return (
    <PlaylistFavoritesContext.Provider value={{ loggedIn: userId !== null, isFavorited, toggleFavorite }}>
      {children}
    </PlaylistFavoritesContext.Provider>
  )
}

export function usePlaylistFavorites() {
  const context = useContext(PlaylistFavoritesContext)
  if (!context) throw new Error('usePlaylistFavorites must be used within a PlaylistFavoritesProvider')
  return context
}
