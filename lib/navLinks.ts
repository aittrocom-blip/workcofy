// The site's primary navigation (master spec §5), shared by Header, Sidebar
// and Footer so they can't drift apart. Inicio isn't listed separately — the
// logo itself already links home in every shell that renders these links.
// Eventos has no section yet, so it's listed but disabled ("Próximamente").
// Rewards lives inside Perfil, not here.
export interface NavLink {
  href: string
  label: string
  icon: string
  disabled?: boolean
}

export const NAV_LINKS: NavLink[] = [
  { href: '/espacios', label: 'Espacios', icon: '/icons/nav-explorar.png' },
  { href: '/oportunidades', label: 'Trabajos remotos', icon: '/icons/nav-equipos.png' },
  { href: '/aprende', label: 'Aprende', icon: '/icons/event-laptop.png' },
  { href: '/eventos', label: 'Eventos', icon: '/icons/nav-eventos.png', disabled: true },
]

export function isNavLinkActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// The authenticated app's primary navigation (bottom tab bar on mobile, top
// tabs on desktop). Icons are inline SVGs in BottomNavigation.tsx keyed by
// `icon`, not PNGs — they need currentColor for the active state.
export type AppNavIcon = 'explorar' | 'spots' | 'pass' | 'beneficios'

export interface AppNavLink {
  href: string
  label: string
  icon: AppNavIcon
}

export const APP_NAV_LINKS: AppNavLink[] = [
  { href: '/app', label: 'Explorar', icon: 'explorar' },
  { href: '/spots', label: 'Espacios', icon: 'spots' },
  { href: '/mi-pass', label: 'Mi Pass', icon: 'pass' },
  { href: '/beneficios', label: 'Beneficios', icon: 'beneficios' },
]
