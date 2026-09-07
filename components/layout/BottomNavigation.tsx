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
    case 'pass':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="9" cy="11" r="2" />
          <path d="M6.3 16c.5-1.5 1.5-2.2 2.7-2.2s2.2.7 2.7 2.2M14.5 10h3.5M14.5 13.5h3.5" />
        </svg>
      )
    case 'beneficios':
      return (
        <svg {...common}>
          <path d="M4 10.5h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5M12 10.5V20M12 10.5c-2.5 0-4.5-1.3-4.5-3S9 5 10.2 5.6 12 8 12 10.5zm0 0c2.5 0 4.5-1.3 4.5-3S15 5 13.8 5.6 12 8 12 10.5z" />
        </svg>
      )
  }
}

// Fixed tab bar for the authenticated app. Sits over the home indicator
// (safe-area padding) and hides on md+, where MobileHeader shows the same
// four destinations as top tabs. Mi Pass gets the one accent in the bar —
// a solid black tile when active — since it's the app's centrepiece.
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
          const isPass = link.icon === 'pass'
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
                    active && isPass ? 'bg-black text-workcofy-yellow' : active ? 'bg-workcofy-yellow/20' : ''
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
