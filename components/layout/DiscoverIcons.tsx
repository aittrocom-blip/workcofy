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

export function TriviaIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M9.2 9a2.9 2.9 0 1 1 5.3 1.7c-.8 1-2.5 1.5-2.5 3.3" />
      <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
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
