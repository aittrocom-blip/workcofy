'use client'

import { useEffect, useState } from 'react'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

// undefined = not fetched yet (or logged out), null = fetched but no avatar
// chosen, string = a chosen avatar id. Shared between Sidebar and the map so
// neither owns a second copy of this fetch.
export function useUserAvatar() {
  const { user } = useAuthUser()
  const [avatarId, setAvatarId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user) {
      setAvatarId(undefined)
      return
    }
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('profiles')
      .select('avatar_id')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) return
        setAvatarId(data?.avatar_id ?? null)
      })
  }, [user])

  return avatarId
}
