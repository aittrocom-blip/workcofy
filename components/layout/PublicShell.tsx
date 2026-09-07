import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// The public website's shell, unchanged from before the app shell existed:
// top navbar + page + footer.
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
