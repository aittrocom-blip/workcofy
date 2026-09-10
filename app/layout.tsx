import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { BodyScrollLock } from '@/components/layout/BodyScrollLock'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'
import { CourseFavoritesProvider } from '@/components/providers/CourseFavoritesProvider'
import { LikesProvider } from '@/components/providers/LikesProvider'
import { USER_ID_HEADER } from '@/lib/supabase/middleware'
import { ActionToast } from '@/components/layout/ActionToast'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'),
  title: 'Workcofy | Trabaja mejor. Desde cualquier lugar.',
  description:
    'Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.',
  applicationName: 'Workcofy',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Workcofy' },
}

// Locks pinch-zoom — a user accidentally zoomed in on mobile and it read as
// "the layout is broken" (content not reaching the real screen edges).
// viewportFit: cover lets the app shell extend under the Dynamic Island /
// home indicator and pad with env(safe-area-inset-*) itself.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by middleware from the verified session (never trusted from the
  // client) — decides public website vs. app shell before hydration.
  const initialUserId = headers().get(USER_ID_HEADER)

  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <FavoritesProvider>
          <CourseFavoritesProvider>
            <LikesProvider>
              <AppShell initialUserId={initialUserId}>{children}</AppShell>
            </LikesProvider>
          </CourseFavoritesProvider>
        </FavoritesProvider>
        <Analytics />
        <BodyScrollLock />
        <ActionToast />
      </body>
    </html>
  )
}
