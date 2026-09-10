'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { APP_NAV_LINKS, isNavLinkActive } from '@/lib/navLinks'
import { RewardsBadge } from '@/components/layout/RewardsBadge'
import { FavoritesShortcut, NotificationsShortcut } from '@/components/layout/FavoritesShortcut'
import { StreakBadge } from '@/components/layout/StreakBadge'
import { SideDrawer } from '@/components/layout/SideDrawer'
import { AppNavIconGlyph } from '@/components/layout/BottomNavigation'

// The app shell's header: [LOGO] ………… [coins 🔥] [☰]. Pads for the Dynamic
// Island via env(safe-area-inset-top). On md+ the four app destinations
// appear as top tabs between the logo and the controls, so desktop keeps
// the same Explorar / Spots / Mi Pass / Beneficios logic without a tab bar.
export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-8">
          <Link href="/app" className="flex items-center py-2 transition-opacity hover:opacity-80" aria-label="Workcofy — Explorar">
            <Image src="/logo-wordmark.png" alt="Workcofy" width={1251} height={476} priority className="h-7 w-auto md:h-8" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones de la app">
            {APP_NAV_LINKS.map((link) => {
              const active = isNavLinkActive(link.href, pathname)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-black text-white' : 'text-[#252A32] hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <AppNavIconGlyph icon={link.icon} className="h-[18px] w-[18px]" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 md:gap-3">
            <div className="flex items-center gap-1 md:gap-2.5">
              <RewardsBadge />
              <StreakBadge />
              <div className="flex items-center gap-0">
                <FavoritesShortcut />
                <NotificationsShortcut />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-black active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
