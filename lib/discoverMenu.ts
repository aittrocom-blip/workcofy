import {
  TagIcon,
  RefreshIcon,
  CalendarIcon,
  HeartLineIcon,
  SharkIcon,
  NetworkIcon,
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
  { label: 'Eventos', Icon: CalendarIcon, href: null, enabled: false, comingSoon: false },
  { label: 'Favoritos', Icon: HeartLineIcon, href: '/favoritos', enabled: true, comingSoon: false },
  { label: 'Tank Shark', Icon: SharkIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Red', Icon: NetworkIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Billetera', Icon: WalletIcon, href: null, enabled: false, comingSoon: true },
  // TODO: point at a dedicated Retos flow once it exists — distinct from
  // the Misiones already shown in /perfil's RewardsPanel.
  { label: 'Retos', Icon: FlameIcon, href: null, enabled: false, comingSoon: false },
  // TODO: point at a reservations flow once it exists.
  { label: 'Reservas', Icon: CalendarCheckIcon, href: null, enabled: false, comingSoon: false },
]
