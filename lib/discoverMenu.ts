import type { LineIcon } from '@/components/layout/DiscoverIcons'
import {
  BeneficiosIcon,
  DescuentosIcon,
  SuscripcionesIcon,
  EventosIcon,
  TriviaImageIcon,
  TankSharkIcon,
  MusicaIcon,
  RetosIcon,
  ReservasIcon,
} from '@/components/layout/DiscoverIconImages'

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
  { label: 'Beneficios', Icon: BeneficiosIcon, href: '/beneficios', enabled: true, comingSoon: false },
  { label: 'Descuentos', Icon: DescuentosIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Suscripciones', Icon: SuscripcionesIcon, href: null, enabled: false, comingSoon: true },
  // TODO: point at /eventos once that section actually ships — today it's
  // still the disabled placeholder in lib/navLinks.ts's NAV_LINKS.
  { label: 'Eventos', Icon: EventosIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Trivia', Icon: TriviaImageIcon, href: '/trivia', enabled: true, comingSoon: false },
  { label: 'Tank Shark', Icon: TankSharkIcon, href: null, enabled: false, comingSoon: true },
  { label: 'Música', Icon: MusicaIcon, href: '/musica', enabled: true, comingSoon: false },
  // TODO: point at a dedicated Retos flow once it exists — distinct from
  // the Misiones already shown in /perfil's RewardsPanel.
  { label: 'Retos', Icon: RetosIcon, href: null, enabled: false, comingSoon: false },
  // TODO: point at a reservations flow once it exists.
  { label: 'Reservas', Icon: ReservasIcon, href: null, enabled: false, comingSoon: true },
]

// Put the two engagement loops the team wants to emphasize first. Keep the
// remaining ecosystem items in their existing order so the drawer remains
// familiar for current users.
const DISCOVER_MENU_ORDER = ['Beneficios', 'Retos', 'Trivia', 'Música', 'Descuentos', 'Suscripciones', 'Eventos', 'Tank Shark', 'Reservas']

export const DISCOVER_MENU_ITEMS_ORDERED = DISCOVER_MENU_ORDER.map((label) =>
  DISCOVER_MENU_ITEMS.find((item) => item.label === label)!
)

// Same order as the drawer (DISCOVER_MENU_ITEMS_ORDERED) so "Más para ti" on
// Explorar and the ☰ drawer never disagree about where things sit.
export const HOME_QUICK_ACTIONS: DiscoverMenuItem[] = DISCOVER_MENU_ITEMS_ORDERED
