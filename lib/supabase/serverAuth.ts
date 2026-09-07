import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

// Request-bound (cookie) client for server components/actions that need the
// viewer's own session — RLS then scopes every query to auth.uid(). The
// plain anon client in lib/supabase/server.ts has no session and is for
// public reads only.
export function createCookieSupabaseClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
      },
    },
  })
}

// Middleware already bounces anonymous visitors off the app routes; this is
// the in-page guarantee (and gives the page the resolved user + client).
export async function requireUser(nextPath: string): Promise<{ user: User; supabase: ReturnType<typeof createCookieSupabaseClient> }> {
  const supabase = createCookieSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  return { user, supabase }
}
