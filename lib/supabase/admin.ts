import 'server-only'
import { createClient } from '@supabase/supabase-js'

// See lib/supabase/server.ts for why this is pinned explicitly instead of
// relying on the route's `dynamic = 'force-dynamic'` to cascade into it.
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' })
}

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    )
  }
  return createClient(url, serviceRoleKey, { global: { fetch: noStoreFetch } })
}
