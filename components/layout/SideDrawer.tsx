'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { NAV_LINKS, isNavLinkActive } from '@/lib/navLinks'
import { LAUNCH_LOCKED } from '@/lib/launchLock'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { useUserName } from '@/lib/hooks/useUserName'
import { avatarFor } from '@/lib/avatars'
import { passIdFor } from '@/lib/pass'

interface SideDrawerProps {
  open: boolean
  onClose: () => void
}

const ROW = 'flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-[17px] font-bold text-black transition-colors active:bg-gray-100'

function Row({ href, onClick, active, disabled, children }: { href?: string; onClick?: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span title="Próximamente" className={`${ROW} cursor-not-allowed text-gray-300`}>
        {children}
      </span>
    )
  }
  const className = `${ROW} ${active ? 'bg-workcofy-yellow/15' : 'hover:bg-gray-50'}`
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-3 border-t border-gray-100" />
}

// The one hamburger menu for both experiences. Slides in from the right with
// a backdrop; content swaps on auth state: guests get the website's sections
// plus Ingresa/Regístrate, members get profile/settings/sign-out (with the
// site's other sections kept reachable underneath — nothing is lost by
// logging in). Stays mounted so the close animation can play.
export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuthUser()
  const isAdmin = useIsAdmin()
  const avatarId = useUserAvatar()
  const userName = useUserName()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    onClose()
    setSigningOut(false)
    router.push('/')
    router.refresh()
  }

  const avatar = avatarFor(avatarId ?? null)

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`absolute inset-y-0 right-0 flex w-[84vw] max-w-sm flex-col bg-white pb-[max(1rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] shadow-[-16px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 md:h-16">
          <Image src="/logo-solo-alpha.png" alt="Workcofy" width={616} height={838} className="h-8 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-black"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-2">
          {user ? (
            <>
              <Link href="/perfil" onClick={onClose} className="mb-2 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.src} alt="" className="h-12 w-12 rounded-full border-2 border-workcofy-yellow object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-black">{userName || 'Tu perfil'}</span>
                  <span className="block truncate text-xs font-semibold tracking-wide text-gray-500">{passIdFor(user.id)}</span>
                </span>
              </Link>
              <Row href="/perfil" onClick={onClose} active={isNavLinkActive('/perfil', pathname)}>
                Mi perfil
              </Row>
              <Row href="/configuracion" onClick={onClose} active={isNavLinkActive('/configuracion', pathname)}>
                Configuración
              </Row>
              <Divider />
              <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Descubrir</p>
              <Row href="/favoritos" onClick={onClose} active={isNavLinkActive('/favoritos', pathname)}>
                Favoritos
              </Row>
              {NAV_LINKS.filter((link) => link.href !== '/espacios').map((link) => (
                <Row key={link.href} href={link.href} onClick={onClose} active={isNavLinkActive(link.href, pathname)} disabled={link.disabled}>
                  {link.label}
                </Row>
              ))}
              {isAdmin && (
                <Row href="/admin/espacios" onClick={onClose} active={pathname.startsWith('/admin')}>
                  Admin
                </Row>
              )}
              <Divider />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={`${ROW} w-full text-left text-gray-500 hover:bg-gray-50 hover:text-black disabled:opacity-60`}
              >
                {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              {NAV_LINKS.map((link) => (
                <Row key={link.href} href={link.href} onClick={onClose} active={isNavLinkActive(link.href, pathname)} disabled={link.disabled}>
                  {link.label}
                </Row>
              ))}
              <Divider />
              {LAUNCH_LOCKED ? (
                <>
                  <Row disabled>Ingresa</Row>
                  <Row disabled>Regístrate</Row>
                </>
              ) : (
                <div className="flex flex-col gap-2.5 px-1 pt-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-center rounded-full bg-workcofy-yellow px-5 text-[15px] font-bold text-black transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    Ingresa
                  </Link>
                  <Link
                    href="/registro"
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-center rounded-full bg-black px-5 text-[15px] font-bold text-white transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    Regístrate
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        <p className="px-6 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">Work anywhere. Work better.</p>
      </aside>
    </div>
  )
}
