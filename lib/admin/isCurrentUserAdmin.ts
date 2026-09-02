import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read-only check for whether the current session belongs to an admin —
// used only to decide whether to show admin-only UI (e.g. "Agregar
// espacio"), never as the actual access gate: /admin/* stays protected by
// middleware.ts regardless of what this returns.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false

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
  if (!user) return false

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ?? false
}
