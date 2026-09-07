'use client'

import { useEffect, useState } from 'react'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

// undefined = not fetched yet (or logged out), null = fetched but no name
// set, string = the profile's chosen name. Mirrors useUserAvatar/useIsAdmin.
export function useUserName(): string | null | undefined {
  const { user } = useAuthUser()
  const [name, setName] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user) {
      setName(undefined)
      return
    }
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) return
        setName(data?.name?.trim() || null)
      })
  }, [user])

  return name
}
