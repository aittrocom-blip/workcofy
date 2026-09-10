'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface LikesContextValue {
  loggedIn: boolean
  isLiked: (spaceId: string) => boolean
  toggleLike: (spaceId: string) => Promise<boolean>
}

const LikesContext = createContext<LikesContextValue | null>(null)

// "Me gusta" — a public per-space signal, separate from favorites (private
// save-for-later). Mirrors FavoritesProvider exactly: one shared query for
// which spaces the current user has liked, so every <LikeButton> reads from
// the same set instead of each firing its own.
export function LikesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadLikes(uid: string | null) {
      if (!uid) {
        setLikedIds(new Set())
        return
      }
      const { data } = await supabase.from('space_likes').select('space_id').eq('user_id', uid)
      setLikedIds(new Set((data ?? []).map((row) => row.space_id as string)))
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

  const isLiked = useCallback((spaceId: string) => likedIds.has(spaceId), [likedIds])

  // Returns the new liked state so LikeButton can adjust its optimistic
  // count (spaces.like_count is on the server-fetched space prop, not
  // something this provider tracks — the trigger keeps it correct on the
  // next real fetch regardless).
  const toggleLike = useCallback(
    async (spaceId: string) => {
      if (!userId) throw new Error('No hay sesión activa.')
      const supabase = createBrowserSupabaseClient()
      const alreadyLiked = likedIds.has(spaceId)

      setLikedIds((current) => {
        const next = new Set(current)
        if (alreadyLiked) next.delete(spaceId)
        else next.add(spaceId)
        return next
      })

      const { error } = alreadyLiked
        ? await supabase.from('space_likes').delete().eq('user_id', userId).eq('space_id', spaceId)
        : await supabase.from('space_likes').insert({ user_id: userId, space_id: spaceId })
      if (error) {
        setLikedIds((current) => {
          const next = new Set(current)
          if (alreadyLiked) next.add(spaceId)
          else next.delete(spaceId)
          return next
        })
        throw error
      }
      return !alreadyLiked
    },
    [userId, likedIds]
  )

  return (
    <LikesContext.Provider value={{ loggedIn: userId !== null, isLiked, toggleLike }}>
      {children}
    </LikesContext.Provider>
  )
}

export function useLikes() {
  const context = useContext(LikesContext)
  if (!context) throw new Error('useLikes must be used within a LikesProvider')
  return context
}
