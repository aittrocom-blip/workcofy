'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, isNavLinkActive } from '@/lib/navLinks'
import { HeaderAuthLinks } from '@/components/layout/HeaderAuthLinks'
import { SideDrawer } from '@/components/layout/SideDrawer'

// Public website header. Desktop keeps the inline section nav + "Cuenta"
// control; below md the hamburger opens the shared SideDrawer (the same one
// the app shell uses), which carries the sections and Ingresa/Regístrate.
export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white">
      {/* Below md the middle nav doesn't render at all (see NAV_LINKS' nav
          below, hidden until md:flex) — grid-cols-[1fr_auto_1fr] with an
          empty middle column collapses that column to 0 and splits the
          other two 1fr tracks 50/50, which visually strands the menu button
          around the horizontal center instead of the right edge. A plain
          flex row avoids that entirely; the grid only kicks in once the nav
          actually has content to center against. */}
      <div className="mx-auto flex h-16 max-w-[1584px] items-center justify-between px-4 sm:px-6 md:grid md:h-[76px] md:grid-cols-[1fr_auto_1fr] md:px-8 lg:px-12">
        <Link href="/" className="flex w-fit items-center py-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-7 w-auto sm:h-8 md:h-10"
          />
        </Link>

        <nav className="hidden items-center gap-5 lg:gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            if (link.disabled) {
              return (
                <span
                  key={link.href}
                  title="Próximamente"
                  className="cursor-not-allowed py-2.5 text-lg font-bold leading-6 text-gray-300"
                >
                  {link.label}
                </span>
              )
            }
            const active = isNavLinkActive(link.href, pathname)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2.5 text-lg font-bold leading-6 transition-colors ${
                  active ? 'text-black' : 'text-[#252A32] hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <HeaderAuthLinks />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-black md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  )
}
