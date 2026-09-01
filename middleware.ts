import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request)

  // The signed-in experience is map-first: the public landing page remains
  // available to visitors, while an authenticated user always continues in
  // their active exploration context instead of returning to marketing home.
  if (user && request.nextUrl.pathname === '/') {
    const redirect = NextResponse.redirect(new URL('/near-me', request.url))
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      const redirect = NextResponse.redirect(loginUrl)
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      const redirect = NextResponse.redirect(new URL('/', request.url))
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.png$).*)'],
}
