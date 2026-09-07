// Shared by BodyScrollLock and Footer — both need to know whether a path is
// the full-screen Espacios map experience (which fills the viewport itself
// and hides the footer/page scroll) vs. a normal page that happens to live
// under /espacios, like /espacios/sugerir, which must scroll and keep its
// footer like any other page.
const NON_MAP_ESPACIOS_ROUTES = ['/espacios/sugerir']

export function isEspaciosMapRoute(pathname: string): boolean {
  if (NON_MAP_ESPACIOS_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return false
  }
  // /spots is the app shell's own full-screen map (same DiscoveryView).
  return pathname === '/espacios' || pathname.startsWith('/espacios/') || pathname === '/spots'
}
