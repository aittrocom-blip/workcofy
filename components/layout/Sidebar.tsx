// components/layout/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NAV_LINKS } from '@/lib/navLinks'
import { AvatarMenu } from '@/components/layout/AvatarMenu'
import { AvatarPickerModal } from '@/components/account/AvatarPickerModal'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

// Real artwork the user supplied for the sidebar, distinct from the
// smaller mobile-menu icons NAV_LINKS.icon already points at (Header's
// mobile dropdown keeps using those, unchanged, since it wasn't part of
// this redesign).
const SIDEBAR_ICONS: Record<string, string> = {
  Espacios: '/icons/sidebar-explorar.png',
  Trabajo: '/icons/sidebar-equipo.png',
  Eventos: '/icons/sidebar-eventos.png',
  Rewards: '/icons/rewards-coin.png',
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthUser()
  const fetchedAvatarId = useUserAvatar()
  // A local override so picking an avatar reflects instantly without
  // waiting on a refetch — useUserAvatar (shared with the map) stays the
  // single source of truth for what's actually persisted.
  const [pickedAvatarId, setPickedAvatarId] = useState<string | null>(null)
  const avatarId = pickedAvatarId ?? fetchedAvatarId
  const [name, setName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('profiles')
      .select('name, is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) return
        setName(data?.name ?? null)
        setIsAdmin(data?.is_admin ?? false)
      })
  }, [user])

  return (
    <aside className="flex h-screen w-[221px] flex-none flex-col border-r border-gray-100 bg-white">
      <div className="px-4 pt-5">
        <Link href={LAUNCH_LOCKED ? '/' : '/near-me'} className="flex items-center gap-2" aria-label="Ir al mapa">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-10 w-auto"
          />
        </Link>
      </div>

      <nav className="mt-6 flex flex-col gap-1 px-2.5">
        {NAV_LINKS.map((link) => {
          const iconSrc = SIDEBAR_ICONS[link.label] ?? link.icon

          if (link.label === 'Espacios' && !LAUNCH_LOCKED) {
            return (
              <Link
                key={link.href}
                href="/near-me"
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-base font-semibold transition-colors ${
                  pathname === '/near-me'
                    ? 'bg-workcofy-yellow/15 text-workcofy-black'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-5 w-auto flex-none" />
                {link.label}
              </Link>
            )
          }

          if (link.label === 'Rewards') {
            return (
              <Link
                key={link.href}
                href="/perfil"
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-base font-medium transition-colors ${
                  pathname === '/perfil'
                    ? 'bg-workcofy-yellow/15 text-workcofy-black'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-5 w-auto flex-none" />
                {link.label}
              </Link>
            )
          }

          return (
            <span
              key={link.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-2 rounded-xl px-2.5 py-2 text-base font-medium text-gray-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconSrc} alt="" className="h-5 w-auto flex-none opacity-40" />
              {link.label}
            </span>
          )
        })}

        {isAdmin && (
          <Link
            href="/admin/espacios"
            className={`mt-2 flex items-center gap-2 rounded-xl border-t border-gray-100 px-2.5 pb-2 pt-3 text-base font-semibold transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-workcofy-yellow/15 text-workcofy-black'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto flex flex-col items-start gap-3 border-t border-gray-100 px-4 py-4">
        {avatarId !== undefined && (
          <AvatarMenu avatarId={avatarId} name={name} lastSignInAt={user?.last_sign_in_at ?? null} />
        )}
      </div>

      {user && avatarId === null && (
        <AvatarPickerModal userId={user.id} onPicked={(id) => setPickedAvatarId(id)} />
      )}
    </aside>
  )
}
