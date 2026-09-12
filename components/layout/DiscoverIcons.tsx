import type { ComponentType } from 'react'

export interface IconProps {
  className?: string
}

export type LineIcon = ComponentType<IconProps>

// Shared linear-icon shell — 24×24 viewBox, currentColor stroke, rounded
// caps/joins — matching the hand-drawn icon style already used elsewhere
// in the app (HeaderAuthLinks.tsx, BottomNavigation.tsx). No icon library
// is installed in this project, so these stay consistent with that
// existing convention rather than introducing a new dependency.
function Base({ children, className = 'h-6 w-6' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

// --- DESCUBRIR grid icons ---

export function TagIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M11.6 3H5a2 2 0 0 0-2 2v6.6c0 .53.21 1.04.59 1.41l9 9a2 2 0 0 0 2.82 0l6.6-6.6a2 2 0 0 0 0-2.82l-9-9A2 2 0 0 0 11.6 3Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M3 11a9 9 0 0 1 15.5-6.2M21 4v5h-5" />
      <path d="M21 13a9 9 0 0 1-15.5 6.2M3 20v-5h5" />
    </Base>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Base>
  )
}

// Same path FavoriteButton/CourseFavoriteButton already use, so the
// "Favoritos" tile reads as the exact same heart everywhere in the app.
export function HeartLineIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z" />
    </Base>
  )
}

export function SharkIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 4c1.5 3 2.2 6 2.2 6s3.3-.7 5.8.6c-1.6 1-3.6 1.4-4.9 1.4h-6.2c-1.8 0-3.6-.5-4.9-1.5 1.7-1 3.4-1.3 4.7-1.1 0 0 .7-2.6 2.2-5.4Z" />
      <path d="M4 15.5c1.2-.8 2.4-.8 3.6 0 1.2.8 2.4.8 3.6 0 1.2-.8 2.4-.8 3.6 0 1.2.8 2.4.8 3.6 0" />
    </Base>
  )
}

export function NetworkIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="6.2" r="2.2" />
      <circle cx="6" cy="17" r="2.2" />
      <circle cx="18" cy="17" r="2.2" />
      <path d="M10.4 7.8 7.6 15M13.6 7.8 16.4 15M8.4 17h7.2" />
    </Base>
  )
}

export function NotesWallIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <rect x="5.5" y="6.5" width="5" height="7" rx="0.7" />
      <path d="M7 9h2M7 11h1M14 9h5v6l-2 2h-3V9ZM17 17v-2h2M5.5 17H10" />
    </Base>
  )
}

export function TriviaIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M5 3h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6l-5 3v-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 4" />
      <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </Base>
  )
}

export function WalletIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11a1 1 0 0 1 1 1v2" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <circle cx="16.3" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function VideoIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function FlameIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3s-4.5 4-4.5 8.5a4.5 4.5 0 0 0 9 0c0-1.4-.6-2.5-1.3-3.4.2 1.6-.6 2.6-1.4 2.1-.7-.4-.4-1.4-.4-2.2C13.4 6.2 12 3 12 3Z" />
      <path d="M9.2 14.3c0 1.8 1.3 3.1 2.8 3.1s2.8-1.3 2.8-3.1" />
    </Base>
  )
}

export function CalendarCheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="m8.5 14.5 2.2 2.2 4.3-4.3" />
    </Base>
  )
}

// --- account / footer rows ---

export function PersonIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </Base>
  )
}

export function GearIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.4 7.4 0 0 0 0-3l1.9-1.5-2-3.4-2.3.6a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.4 7.4 0 0 0-2.6 1.5l-2.3-.6-2 3.4L4.6 10a7.4 7.4 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.6a7.4 7.4 0 0 0 2.6 1.5L10 22h4l.4-2.3a7.4 7.4 0 0 0 2.6-1.5l2.3.6 2-3.4-1.9-1.5Z" />
    </Base>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </Base>
  )
}

export function StoreIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M4 9.5 5 4h14l1 5.5" />
      <path d="M3.5 9.5a2.3 2.3 0 0 0 4.5.6 2.3 2.3 0 0 0 4.5 0 2.3 2.3 0 0 0 4.5 0 2.3 2.3 0 0 0 4.5-.6" />
      <path d="M5 10v9a1 1 0 0 0 1 1h5v-6h2v6h5a1 1 0 0 0 1-1v-9" />
    </Base>
  )
}

export function InfoIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 8l4 4-4 4M14 12H3" />
    </Base>
  )
}

export function ChevronRightIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <Base className={className}>
      <path d="m9 6 6 6-6 6" />
    </Base>
  )
}
