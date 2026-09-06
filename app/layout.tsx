import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'),
  title: 'Workcofy | Trabaja mejor. Desde cualquier lugar.',
  description:
    'Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <FavoritesProvider>
          <AppShell>{children}</AppShell>
        </FavoritesProvider>
      </body>
    </html>
  )
}
