'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HeaderAuthLinks } from '@/components/layout/HeaderAuthLinks'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
          className="rounded-full border border-gray-200 p-2 transition-colors hover:border-black md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo-solo.png"
            alt="Workcofy"
            width={32}
            height={32}
            className="h-8 w-8 md:hidden"
          />
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="hidden h-10 w-auto md:block"
          />
        </Link>

        <nav className="hidden gap-8 text-sm font-medium text-gray-700 md:flex">
          <Link href="/" className="transition-colors hover:text-black">
            Explorar
          </Link>
          <Link href="/near-me" className="transition-colors hover:text-black">
            Cerca de mí
          </Link>
          <Link href="/miraflores" className="transition-colors hover:text-black">
            Distritos
          </Link>
          <Link href="/#coins" className="transition-colors hover:text-black">
            Workcofy Coins
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/near-me"
            className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            Usar mi ubicación
          </Link>
          <HeaderAuthLinks />
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-100 px-4 py-2 text-sm font-medium md:hidden">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            Explorar
          </Link>
          <Link
            href="/near-me"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            Cerca de mí
          </Link>
          <Link
            href="/miraflores"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            Distritos
          </Link>
          <Link
            href="/#coins"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            Workcofy Coins
          </Link>
          <div className="mt-1 border-t border-gray-100 pt-1">
            <HeaderAuthLinks variant="mobile" />
          </div>
        </nav>
      )}
    </header>
  )
}
