import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { BodyScrollLock } from '@/components/layout/BodyScrollLock'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'
import { CourseFavoritesProvider } from '@/components/providers/CourseFavoritesProvider'
import { LikesProvider } from '@/components/providers/LikesProvider'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'),
  title: 'Workcofy | Trabaja mejor. Desde cualquier lugar.',
  description:
    'Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.',
}

// Locks pinch-zoom — a user accidentally zoomed in on mobile and it read as
// "the layout is broken" (content not reaching the real screen edges).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <FavoritesProvider>
          <CourseFavoritesProvider>
            <LikesProvider>
              <AppShell>{children}</AppShell>
            </LikesProvider>
          </CourseFavoritesProvider>
        </FavoritesProvider>
        <Analytics />
        <BodyScrollLock />
      </body>
    </html>
  )
}
