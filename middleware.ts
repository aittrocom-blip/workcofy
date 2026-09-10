import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

// While the online version is under maintenance, these routes redirect back
// to the marketing home instead of loading — Espacios and the whole
// login/registro/reset flow. Everything else on the site stays reachable.
// Local dev never sets NEXT_PUBLIC_LAUNCH_LOCKED, so none of this applies there.
const LOCKED_PATHS = ['/espacios', '/login', '/registro', '/recuperar', '/restablecer']

// The authenticated app's own screens (see lib/navLinks.ts APP_NAV_LINKS).
// /perfil and /favoritos guard themselves server-side already.
const APP_ONLY_PATHS = ['/app', '/spots', '/mi-pass', '/beneficios', '/configuracion', '/trivia']

function isAppOnlyPath(pathname: string): boolean {
  return APP_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  if (
    LAUNCH_LOCKED &&
    LOCKED_PATHS.some(
      (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { response, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Signed-in users live in the app shell — the marketing home becomes
  // Explorar, and login/registro have nothing left to offer them.
  if (user && (pathname === '/' || pathname === '/login' || pathname === '/registro')) {
    const redirect = NextResponse.redirect(new URL('/app', request.url))
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (!user && isAppOnlyPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (pathname.startsWith('/admin')) {
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
