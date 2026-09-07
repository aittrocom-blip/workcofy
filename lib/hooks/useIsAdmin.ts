'use client'

import { useEffect, useState } from 'react'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

// Read-only, client-side check used only to decide whether to show
// admin-only UI (e.g. the "Admin" item in the account menu) — never the
// actual access gate: /admin/* stays protected by middleware.ts regardless.
export function useIsAdmin(): boolean {
  const { user } = useAuthUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) return
        setIsAdmin(data?.is_admin ?? false)
      })
  }, [user])

  return isAdmin
}
