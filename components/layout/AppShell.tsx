// components/layout/AppShell.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useIsDesktop } from '@/lib/hooks/useIsDesktop'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuthUser()
  const isDesktop = useIsDesktop()
  // Authenticated desktop routes share the same application shell so moving
  // from the map to profile never drops the user back into the marketing
  // header/footer layout.
  const showSidebarLayout = (pathname === '/near-me' || pathname === '/perfil') && !loading && user !== null && isDesktop

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
