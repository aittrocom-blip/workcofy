'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface FavoritesContextValue {
  loggedIn: boolean
  isFavorited: (spaceId: string) => boolean
  toggleFavorite: (spaceId: string) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

// Loads the current user's favorited space ids once (and on login/logout),
// so every <FavoriteButton> on the page shares one query instead of each
// firing its own — mirrors HeaderAuthLinks' own auth-state subscription.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadFavorites(uid: string | null) {
      if (!uid) {
        setFavoriteIds(new Set())
        return
      }
      const { data } = await supabase.from('favorites').select('space_id').eq('user_id', uid)
      setFavoriteIds(new Set((data ?? []).map((row) => row.space_id as string)))
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

  const isFavorited = useCallback((spaceId: string) => favoriteIds.has(spaceId), [favoriteIds])

  const toggleFavorite = useCallback(
    async (spaceId: string) => {
      if (!userId) return
      const supabase = createBrowserSupabaseClient()
      const alreadyFavorited = favoriteIds.has(spaceId)

      // Optimistic update — a failed write just means the next toggle
      // reads a stale set, an acceptable tradeoff for a low-stakes action.
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (alreadyFavorited) next.delete(spaceId)
        else next.add(spaceId)
        return next
      })

      if (alreadyFavorited) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('space_id', spaceId)
      } else {
        await supabase.from('favorites').insert({ user_id: userId, space_id: spaceId })
      }
    },
    [userId, favoriteIds]
  )

  return (
    <FavoritesContext.Provider value={{ loggedIn: userId !== null, isFavorited, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider')
  return context
}
