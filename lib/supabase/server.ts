import { createClient } from '@supabase/supabase-js'

// Explicit cache: 'no-store' on every request this client makes — relying on
// the route's `dynamic = 'force-dynamic'` to implicitly disable Next's fetch
// cache for calls made *inside* the supabase-js client turned out not to be
// reliable (seen in both dev and production: newly-written rows were
// missing from a read moments later, from the exact same anon key, until a
// full redeploy). Pinning it here removes the ambiguity.
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' })
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return createClient(url, anonKey, { global: { fetch: noStoreFetch } })
}
