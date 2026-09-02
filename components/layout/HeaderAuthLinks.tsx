'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { RewardsBadge } from '@/components/layout/RewardsBadge'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

interface HeaderAuthLinksProps {
  variant?: 'desktop' | 'mobile'
  /** Mobile only — closes the drawer this renders inside once an item is picked. */
  onNavigate?: () => void
}

function UserIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  )
}

function UserPlusIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M2.5 20c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
      <path strokeLinecap="round" d="M18 4.5v6M15 7.5h6" />
    </svg>
  )
}

function HeartIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z"
      />
    </svg>
  )
}

function LogoutIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 8l4 4-4 4M14 12H3" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-none transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

// Menu items share one row style — icon + label, hover picks up the brand
// yellow tint so the dropdown reads as one family regardless of which
// section (guest vs signed-in) is showing.
function MenuItem({
  href,
  onClick,
  icon,
  children,
  disabled,
}: {
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
}) {
  const className =
    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-[#FFF4D6] hover:text-black'
  if (disabled) {
    return (
      <span title="Próximamente" className={`cursor-not-allowed text-gray-300 ${className} hover:bg-transparent hover:text-gray-300`}>
        {icon}
        {children}
      </span>
    )
  }
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {icon}
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`w-full text-left ${className}`}>
      {icon}
      {children}
    </button>
  )
}

export function HeaderAuthLinks({ variant = 'desktop', onNavigate }: HeaderAuthLinksProps) {
  const router = useRouter()
  const { user, loading, signOut } = useAuthUser()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    onNavigate?.()
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-1">
        {user ? (
          <>
            <div className="px-2 py-1">
              <RewardsBadge />
            </div>
            <Link
              href="/favoritos"
              onClick={onNavigate}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Favoritos
            </Link>
            <Link
              href="/perfil"
              onClick={onNavigate}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Perfil
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-black"
            >
              Cerrar sesión
            </button>
          </>
        ) : LAUNCH_LOCKED ? (
          <>
            <span title="Próximamente" className="cursor-not-allowed rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-300">
              Ingresa
            </span>
            <span title="Próximamente" className="cursor-not-allowed rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-300">
              Regístrate
            </span>
          </>
        ) : (
          <>
            <Link
              href="/login"
              onClick={onNavigate}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ingresa
            </Link>
            <Link
              href="/registro"
              onClick={onNavigate}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Regístrate
            </Link>
          </>
        )}
      </div>
    )
  }

  // Desktop — a single secondary "Cuenta" control instead of competing CTAs;
  // its dropdown swaps content by session state but keeps the same shell.
  if (loading) return <div className="h-11 w-[120px] rounded-full bg-gray-50" />

  return (
    <div ref={rootRef} className="relative hidden items-center gap-3 sm:flex">
      {user && <RewardsBadge />}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D9DDE3] px-4 text-[15px] font-medium text-[#252A32] transition-colors hover:border-black"
      >
        <UserIcon />
        Cuenta
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[176px] rounded-xl border border-[#EEEEEE] bg-white p-2 shadow-[0_16px_32px_rgba(17,24,39,0.12)]">
          {user ? (
            <>
              <MenuItem href="/perfil" onClick={() => setOpen(false)} icon={<UserIcon />}>
                Perfil
              </MenuItem>
              <MenuItem href="/near-me?view=map&favorites=1" onClick={() => setOpen(false)} icon={<HeartIcon />}>
                Favoritos
              </MenuItem>
              <MenuItem onClick={handleSignOut} icon={<LogoutIcon />}>
                Cerrar sesión
              </MenuItem>
            </>
          ) : LAUNCH_LOCKED ? (
            <>
              <MenuItem icon={<UserIcon />} disabled>
                Ingresa
              </MenuItem>
              <MenuItem icon={<UserPlusIcon />} disabled>
                Regístrate
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem href="/login" onClick={() => setOpen(false)} icon={<UserIcon />}>
                Ingresa
              </MenuItem>
              <MenuItem href="/registro" onClick={() => setOpen(false)} icon={<UserPlusIcon />}>
                Regístrate
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  )
}
