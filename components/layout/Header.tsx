'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAV_LINKS } from '@/lib/navLinks'
import { HeaderAuthLinks } from '@/components/layout/HeaderAuthLinks'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-8 w-auto md:h-10"
          />
        </Link>

        <nav className="hidden gap-4 text-base font-bold text-gray-700 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-black">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/near-me"
            className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            Explora
          </Link>
          <HeaderAuthLinks />
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="rounded-full border border-gray-200 p-2.5 transition-colors hover:border-black md:hidden"
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
        <nav className="flex flex-col gap-1 border-t border-gray-100 px-4 py-2 text-sm font-medium md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={link.icon} alt="" className="h-4 w-4 opacity-70" />
              {link.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-gray-100 pt-1">
            <HeaderAuthLinks variant="mobile" />
          </div>
        </nav>
      )}
    </header>
  )
}
