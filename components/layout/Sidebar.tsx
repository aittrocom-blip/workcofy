// components/layout/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, isNavLinkActive } from '@/lib/navLinks'
import { AvatarMenu } from '@/components/layout/AvatarMenu'
import { AvatarPickerModal } from '@/components/account/AvatarPickerModal'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

// Real artwork the user supplied for the sidebar, distinct from the
// smaller mobile-menu icons NAV_LINKS.icon already points at.
const SIDEBAR_ICONS: Record<string, string> = {
  Oportunidades: '/icons/sidebar-equipo.png',
  Aprende: '/icons/event-laptop.png',
  Espacios: '/icons/sidebar-explorar.png',
}

const ITEM = 'flex items-center gap-2 rounded-xl px-2.5 py-2 text-base font-semibold transition-colors'
const ITEM_ACTIVE = 'bg-workcofy-yellow/15 text-workcofy-black'
const ITEM_IDLE = 'text-gray-700 hover:bg-gray-50'

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
        <Link href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
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
        {/* Inicio is omitted here: the logo above already links home. */}
        {NAV_LINKS.filter((link) => link.href !== '/').map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${ITEM} ${isNavLinkActive(link.href, pathname) ? ITEM_ACTIVE : ITEM_IDLE}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SIDEBAR_ICONS[link.label] ?? link.icon} alt="" className="h-5 w-auto flex-none" />
            {link.label}
          </Link>
        ))}

        <Link href="/perfil" className={`${ITEM} ${pathname === '/perfil' ? ITEM_ACTIVE : ITEM_IDLE}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/rewards-coin.png" alt="" className="h-5 w-auto flex-none" />
          Perfil
        </Link>

        {isAdmin && (
          <Link
            href="/admin/espacios"
            className={`mt-2 flex items-center gap-2 rounded-xl border-t border-gray-100 px-2.5 pb-2 pt-3 text-base font-semibold transition-colors ${
              pathname.startsWith('/admin') ? ITEM_ACTIVE : ITEM_IDLE
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
