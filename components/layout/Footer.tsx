'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { NAV_LINKS } from '@/lib/navLinks'

export function Footer() {
  const year = new Date().getFullYear()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // The full-screen map on /near-me is meant to use the entire viewport —
  // a footer below it would just be scrollable dead space under the map.
  if (pathname === '/near-me' && searchParams.get('view') === 'map') return null

  return (
    <footer className="border-t border-gray-100 px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Link href="/" className="inline-block">
            <Image
              src="/logo-wordmark.png"
              alt="Workcofy"
              width={1251}
              height={476}
              className="h-5 w-auto opacity-60"
            />
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            Encuentra tu mejor lugar para trabajar, colaborar y aprender — descubierto y
            verificado por nuestra comunidad.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Secciones</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Workcofy</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
              <li>Nosotros</li>
              <li>Valores</li>
              <li>Worky</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-6 text-xs text-gray-400">
        <span>© {year} Workcofy. Todos los derechos reservados.</span>
        <Link href="/terminos" className="hover:text-black">
          Términos
        </Link>
        <Link href="/privacidad" className="hover:text-black">
          Privacidad
        </Link>
      </div>
    </footer>
  )
}
