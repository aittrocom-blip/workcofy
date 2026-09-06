// The site's primary navigation (master spec §5), shared by Header, Sidebar
// and Footer so they can't drift apart. Eventos is deliberately absent for
// the validation MVP; Rewards lives inside Perfil, not here.
export const NAV_LINKS = [
  { href: '/', label: 'Inicio', icon: '/icons/nav-menu.png' },
  { href: '/oportunidades', label: 'Oportunidades', icon: '/icons/nav-equipos.png' },
  { href: '/aprende', label: 'Aprende', icon: '/icons/event-laptop.png' },
  { href: '/espacios', label: 'Espacios', icon: '/icons/nav-explorar.png' },
]

export function isNavLinkActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
