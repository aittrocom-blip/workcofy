// components/layout/AppShell.tsx
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// Every page shares the same shell — the top navbar plus its footer. Perfil
// used to swap this out for a left sidebar; it's a normal page like any
// other now, so Perfil/Favoritos just render under the standard Header.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
