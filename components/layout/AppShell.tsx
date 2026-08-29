// components/layout/AppShell.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'

// Matches Tailwind's `md` breakpoint (768px) — the same threshold every
// other desktop/mobile split in this codebase already uses (e.g.
// FiltersBar's `hidden md:block` / `md:hidden` pairs).
const DESKTOP_QUERY = '(min-width: 768px)'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(mql.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuthUser()
  const isDesktop = useIsDesktop()
  const showSidebarLayout = pathname === '/near-me' && !loading && user !== null && isDesktop

  if (showSidebarLayout) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
