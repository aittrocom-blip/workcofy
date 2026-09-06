'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/espacios', label: 'Espacios' },
  { href: '/admin/usuarios', label: 'Usuarios' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
