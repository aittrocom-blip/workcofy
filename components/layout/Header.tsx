'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
          className="rounded-full border border-gray-300 p-2 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-solo.png"
            alt="Workcofy"
            width={32}
            height={32}
            className="h-8 w-8 md:hidden"
          />
          <Image
            src="/logov1.png"
            alt="Workcofy"
            width={140}
            height={32}
            className="hidden h-8 w-auto md:block"
          />
        </Link>

        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <Link href="/">Explorar</Link>
          <Link href="/near-me">Cerca de mí</Link>
          <Link href="/miraflores">Distritos</Link>
          <Link href="/#coins" className="transition-colors hover:text-black">
            Workcofy Coins
          </Link>
        </nav>

        <Link href="/near-me" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
          Usar mi ubicación
        </Link>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-2 text-sm font-medium md:hidden">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2">
            Explorar
          </Link>
          <Link href="/near-me" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2">
            Cerca de mí
          </Link>
          <Link href="/miraflores" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-2">
            Distritos
          </Link>
          <Link
            href="/#coins"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
          >
            Workcofy Coins
          </Link>
        </nav>
      )}
    </header>
  )
}
