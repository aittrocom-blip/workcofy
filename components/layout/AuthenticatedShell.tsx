import Link from 'next/link'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

// HEADER → CONTENT → BOTTOM NAV. The two CSS variables are what every
// viewport-sized screen (the /spots map) subtracts from 100dvh, and what
// <main> pads for so nothing hides under the fixed tab bar. Both include the
// iPhone safe areas; on md+ the tab bar disappears and its height goes to 0.
export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col [--app-bottom-nav-height:calc(4rem+env(safe-area-inset-bottom))] [--app-header-height:calc(3.5rem+1px+env(safe-area-inset-top))] md:[--app-bottom-nav-height:0px] md:[--app-header-height:calc(4rem+1px)]">
      <MobileHeader />
      <main className="flex-1 pb-[var(--app-bottom-nav-height)]">{children}</main>
      <footer className="hidden border-t border-gray-100 px-8 py-5 text-xs text-gray-400 md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} Workcofy · Work anywhere. Work better.</span>
          <Link href="/terminos" className="hover:text-black">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-black">
            Privacidad
          </Link>
        </div>
      </footer>
      <BottomNavigation />
    </div>
  )
}
