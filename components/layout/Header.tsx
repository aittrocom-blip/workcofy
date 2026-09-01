'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAV_LINKS } from '@/lib/navLinks'
import { HeaderAuthLinks } from '@/components/layout/HeaderAuthLinks'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:h-[76px] md:px-8 lg:px-12">
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2.5 text-base font-semibold leading-6 text-[#252A32] transition-colors hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <HeaderAuthLinks />
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-black md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm font-medium shadow-[0_12px_24px_rgba(0,0,0,0.06)] md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={link.icon} alt="" className="h-4 w-4 opacity-70" />
              {link.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-gray-100 pt-1">
            <HeaderAuthLinks variant="mobile" onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  )
}
