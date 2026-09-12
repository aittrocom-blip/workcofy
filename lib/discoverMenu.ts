import {
  TagIcon,
  RefreshIcon,
  CalendarIcon,
  TriviaIcon,
  SharkIcon,
  NotesWallIcon,
  WalletIcon,
  FlameIcon,
  CalendarCheckIcon,
  type LineIcon,
} from '@/components/layout/DiscoverIcons'

export interface DiscoverMenuItem {
  label: string
  Icon: LineIcon
  href: string | null
  /** Can actually be tapped and go somewhere right now. */
  enabled: boolean
  /** Shows the small "Pronto" badge — reserved for pieces of the ecosystem
   *  that don't exist at all yet (no page, no data). Distinct from
   *  `enabled: false` on its own: Eventos/Retos/Reservas below are
   *  "enabled: false" too (no route to send them to yet) but aren't
   *  flagged "Pronto" since they're not being announced as a future
   *  feature, just not wired up — see the per-item TODOs. */
  comingSoon: boolean
}

// The app drawer's DESCUBRIR grid — everything in Workcofy's ecosystem
// beyond spaces/jobs/courses, which already live in the bottom nav and
// desktop top tabs and are deliberately left out here to avoid duplicating
// navigation. Data-driven on purpose (see DiscoverGrid.tsx): flipping a
// microsection on later is a one-line edit here, not a component rewrite.
export const DISCOVER_MENU_ITEMS: DiscoverMenuItem[] = [
  { label: 'Descuentos', Icon: TagIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Suscripciones', Icon: RefreshIcon, href: null, enabled: false, comingSoon: true },
  // TODO: point at /eventos once that section actually ships — today it's
  // still the disabled placeholder in lib/navLinks.ts's NAV_LINKS.
  { label: 'Eventos', Icon: CalendarIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Trivia', Icon: TriviaIcon, href: '/trivia', enabled: true, comingSoon: false },
  { label: 'Tank Shark', Icon: SharkIcon, href: null, enabled: false, comingSoon: true },
  { label: 'El Muro', Icon: NotesWallIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Billetera', Icon: WalletIcon, href: null, enabled: false, comingSoon: true },
  // TODO: point at a dedicated Retos flow once it exists — distinct from
  // the Misiones already shown in /perfil's RewardsPanel.
  { label: 'Retos', Icon: FlameIcon, href: null, enabled: false, comingSoon: false },
  // TODO: point at a reservations flow once it exists.
  { label: 'Reservas', Icon: CalendarCheckIcon, href: null, enabled: false, comingSoon: true },
]

// Put the two engagement loops the team wants to emphasize first. Keep the
// remaining ecosystem items in their existing order so the drawer remains
// familiar for current users.
const DISCOVER_MENU_ORDER = ['Retos', 'Trivia', 'Descuentos', 'Suscripciones', 'Eventos', 'Tank Shark', 'El Muro', 'Billetera', 'Reservas']

export const DISCOVER_MENU_ITEMS_ORDERED = DISCOVER_MENU_ORDER.map((label) =>
  DISCOVER_MENU_ITEMS.find((item) => item.label === label)!
)

// Reuse real destinations when these sections ship. Missing routes stay inert.
export const HOME_QUICK_ACTIONS: DiscoverMenuItem[] = [
  'Descuentos', 'Suscripciones', 'Eventos', 'Trivia', 'Tank Shark', 'El Muro', 'Billetera', 'Retos', 'Reservas',
].map((label) => {
  const item = DISCOVER_MENU_ITEMS.find((entry) => entry.label === label)!
  return {
    ...item,
    label: label === 'El Muro' ? 'Muro' : label,
    comingSoon: item.comingSoon,
  }
})
