'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface CourseFavoritesContextValue {
  loggedIn: boolean
  isFavorited: (courseId: string) => boolean
  toggleFavorite: (courseId: string) => Promise<boolean>
}

const CourseFavoritesContext = createContext<CourseFavoritesContextValue | null>(null)

// Mirrors FavoritesProvider (spaces) exactly, over its own course_favorites
// table — saved courses for "come back to this later", separate from any
// share/click tracking.
export function CourseFavoritesProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadFavorites(uid: string | null) {
      if (!uid) {
        setFavoriteIds(new Set())
        return
      }
      const { data } = await supabase.from('course_favorites').select('course_id').eq('user_id', uid)
      setFavoriteIds(new Set((data ?? []).map((row) => row.course_id as string)))
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

  const isFavorited = useCallback((courseId: string) => favoriteIds.has(courseId), [favoriteIds])

  const toggleFavorite = useCallback(
    async (courseId: string) => {
      if (!userId) throw new Error('No hay sesión activa.')
      const supabase = createBrowserSupabaseClient()
      const alreadyFavorited = favoriteIds.has(courseId)

      // Optimistic update — same tradeoff as the spaces version: a failed
      // write just means the next toggle reads a stale set.
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (alreadyFavorited) next.delete(courseId)
        else next.add(courseId)
        return next
      })

      const { error } = alreadyFavorited
        ? await supabase.from('course_favorites').delete().eq('user_id', userId).eq('course_id', courseId)
        : await supabase.from('course_favorites').insert({ user_id: userId, course_id: courseId })
      if (error) {
        setFavoriteIds((current) => {
          const next = new Set(current)
          if (alreadyFavorited) next.add(courseId)
          else next.delete(courseId)
          return next
        })
        throw error
      }
      return !alreadyFavorited
    },
    [userId, favoriteIds]
  )

  return (
    <CourseFavoritesContext.Provider value={{ loggedIn: userId !== null, isFavorited, toggleFavorite }}>
      {children}
    </CourseFavoritesContext.Provider>
  )
}

export function useCourseFavorites() {
  const context = useContext(CourseFavoritesContext)
  if (!context) throw new Error('useCourseFavorites must be used within a CourseFavoritesProvider')
  return context
}
