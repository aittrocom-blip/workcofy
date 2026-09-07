'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { useUserName } from '@/lib/hooks/useUserName'
import { avatarFor } from '@/lib/avatars'
import { RewardsBadge } from '@/components/layout/RewardsBadge'
import { StreakBadge } from '@/components/layout/StreakBadge'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

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

function AdminIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
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

export function HeaderAuthLinks() {
  const router = useRouter()
  const { user, loading, signOut } = useAuthUser()
  const avatarId = useUserAvatar()
  const isAdmin = useIsAdmin()
  const userName = useUserName()
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
    await signOut()
    router.push('/')
    router.refresh()
  }

  // Desktop only (below md the Header's hamburger opens SideDrawer instead) —
  // a single secondary "Cuenta" control whose dropdown swaps content by
  // session state but keeps the same shell.
  if (loading) return <div className="h-11 w-[120px] rounded-full bg-gray-50" />

  return (
    <div ref={rootRef} className="relative hidden items-center gap-3 sm:flex">
      {user && <RewardsBadge />}
      {user && <StreakBadge />}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-11 max-w-[180px] items-center gap-2 rounded-full border border-[#D9DDE3] px-4 text-[15px] font-medium text-[#252A32] transition-colors hover:border-black"
      >
        {user ? (
          <span className="h-6 w-6 flex-none overflow-hidden rounded-full border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarFor(avatarId ?? null).src} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <UserIcon />
        )}
        <span className="truncate">{user && userName ? userName : 'Cuenta'}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[176px] rounded-xl border border-[#EEEEEE] bg-white p-2 shadow-[0_16px_32px_rgba(17,24,39,0.12)]">
          {user ? (
            <>
              <MenuItem href="/perfil" onClick={() => setOpen(false)} icon={<UserIcon />}>
                Perfil
              </MenuItem>
              <MenuItem href="/favoritos" onClick={() => setOpen(false)} icon={<HeartIcon />}>
                Favoritos
              </MenuItem>
              {isAdmin && (
                <MenuItem href="/admin/espacios" onClick={() => setOpen(false)} icon={<AdminIcon />}>
                  Admin
                </MenuItem>
              )}
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
