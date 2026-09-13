'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface PlaylistLikesContextValue {
  loggedIn: boolean
  isLiked: (playlistId: string) => boolean
  toggleLike: (playlistId: string) => Promise<boolean>
}

const PlaylistLikesContext = createContext<PlaylistLikesContextValue | null>(null)

// "Me gusta" on Spotify playlists — mirrors LikesProvider (spaces) exactly,
// over its own playlist_likes table, since playlists aren't rows we own.
export function PlaylistLikesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadLikes(uid: string | null) {
      if (!uid) {
        setLikedIds(new Set())
        return
      }
      const { data } = await supabase.from('playlist_likes').select('playlist_id').eq('user_id', uid)
      setLikedIds(new Set((data ?? []).map((row) => row.playlist_id as string)))
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadLikes(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      loadLikes(uid)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isLiked = useCallback((playlistId: string) => likedIds.has(playlistId), [likedIds])

  const toggleLike = useCallback(
    async (playlistId: string) => {
      if (!userId) throw new Error('No hay sesión activa.')
      const supabase = createBrowserSupabaseClient()
      const alreadyLiked = likedIds.has(playlistId)

      setLikedIds((current) => {
        const next = new Set(current)
        if (alreadyLiked) next.delete(playlistId)
        else next.add(playlistId)
        return next
      })

      const { error } = alreadyLiked
        ? await supabase.from('playlist_likes').delete().eq('user_id', userId).eq('playlist_id', playlistId)
        : await supabase.from('playlist_likes').insert({ user_id: userId, playlist_id: playlistId })
      if (error) {
        setLikedIds((current) => {
          const next = new Set(current)
          if (alreadyLiked) next.add(playlistId)
          else next.delete(playlistId)
          return next
        })
        throw error
      }
      return !alreadyLiked
    },
    [userId, likedIds]
  )

  return (
    <PlaylistLikesContext.Provider value={{ loggedIn: userId !== null, isLiked, toggleLike }}>
      {children}
    </PlaylistLikesContext.Provider>
  )
}

export function usePlaylistLikes() {
  const context = useContext(PlaylistLikesContext)
  if (!context) throw new Error('usePlaylistLikes must be used within a PlaylistLikesProvider')
  return context
}
