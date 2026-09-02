// Mirrors the landing page's own section order (Hero → 01 Explorar → 02
// Equipos → 03 Eventos → 04 Rewards) so the header nav and footer always
// match what's actually on the page — shared here instead of duplicated so
// they can't drift apart.
export const NAV_LINKS = [
  { href: '/#explorar', label: 'Espacios', icon: '/icons/nav-explorar.png' },
  { href: '/#equipos', label: 'Trabajo', icon: '/icons/nav-equipos.png' },
  { href: '/#eventos', label: 'Eventos', icon: '/icons/nav-eventos.png' },
  { href: '/#rewards', label: 'Rewards', icon: '/icons/nav-rewards.png' },
]
