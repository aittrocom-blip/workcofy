// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NAV_LINKS } from '@/lib/navLinks'
import { RewardsBadge } from '@/components/layout/RewardsBadge'

// Real artwork the user supplied for the sidebar, distinct from the
// smaller mobile-menu icons NAV_LINKS.icon already points at (Header's
// mobile dropdown keeps using those, unchanged, since it wasn't part of
// this redesign). No dedicated "Equipos" icon was supplied — it falls back
// to the existing shared NAV_LINKS.icon for that one item.
const SIDEBAR_ICONS: Record<string, string> = {
  Explorar: '/icons/sidebar-explorar.png',
  Comunidad: '/icons/sidebar-comunidad.png',
  Eventos: '/icons/sidebar-eventos.png',
  Rewards: '/icons/sidebar-rewards.png',
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-[280px] flex-none flex-col border-r border-gray-100 bg-white">
      <div className="px-5 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <nav className="mt-8 flex flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const iconSrc = SIDEBAR_ICONS[link.label] ?? link.icon

          if (link.label === 'Explorar') {
            return (
              <span
                key={link.href}
                className="flex items-center gap-2.5 rounded-xl bg-workcofy-yellow/15 px-3 py-2.5 text-sm font-semibold text-workcofy-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </span>
            )
          }

          if (link.label === 'Rewards') {
            return (
              <Link
                key={link.href}
                href="/perfil"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </Link>
            )
          }

          return (
            <span
              key={link.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconSrc} alt="" className="h-4 w-4 opacity-40" />
              {link.label}
            </span>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4 border-t border-gray-100 px-5 py-6">
        <RewardsBadge size="lg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatars/explorador-default.png"
          alt=""
          className="h-11 w-11 rounded-full border border-gray-200 object-cover"
        />
      </div>
    </aside>
  )
}
