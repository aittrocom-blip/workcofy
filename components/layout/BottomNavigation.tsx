'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV_LINKS, isNavLinkActive, type AppNavIcon } from '@/lib/navLinks'

export function AppNavIconGlyph({ icon, className = 'h-6 w-6' }: { icon: AppNavIcon; className?: string }) {
  const common = { viewBox: '0 0 24 24', className, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (icon) {
    case 'explorar':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2.2 5.3-5.3 2.2 2.2-5.3z" />
        </svg>
      )
    case 'spots':
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      )
    case 'aprende':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
          <path d="M4 5.5v16M8 7h8M8 11h8M8 15h5" />
        </svg>
      )
    case 'trabajo':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2" />
        </svg>
      )
  }
}

// Fixed tab bar for the authenticated app. Sits over the home indicator
// (safe-area padding) and hides on md+, where MobileHeader shows the same
// four destinations as top tabs. Mi Pass remains in the side menu.
export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F0F0F0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {APP_NAV_LINKS.map((link) => {
          const active = isNavLinkActive(link.href, pathname)
          return (
            <li key={link.href} className="flex">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                  active ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span
                  className={`flex h-8 w-11 items-center justify-center rounded-2xl transition-all ${
                    active ? 'bg-workcofy-yellow/20' : ''
                  }`}
                >
                  <AppNavIconGlyph icon={link.icon} className={`h-[22px] w-[22px] ${active ? 'stroke-[2.2]' : ''}`} />
                </span>
                <span className={`text-[11px] leading-none tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>{link.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
