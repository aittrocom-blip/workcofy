import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the session cookie on every request (the standard @supabase/ssr
// pattern) and returns both the response to continue with and the resolved
// user, so callers (middleware.ts) can make routing decisions without a
// second round trip.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The root layout picks the public shell vs. the authenticated app shell
  // from this header, so the choice is made server-side on the first paint
  // (no flash of the wrong shell) without a second auth round trip. Always
  // reset it: a client-supplied value must never survive into the request.
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.delete(USER_ID_HEADER)
  if (user) forwardedHeaders.set(USER_ID_HEADER, user.id)
  const withUser = NextResponse.next({ request: { headers: forwardedHeaders } })
  response.cookies.getAll().forEach((cookie) => withUser.cookies.set(cookie))

  return { response: withUser, user, supabase }
}

export const USER_ID_HEADER = 'x-workcofy-user-id'
