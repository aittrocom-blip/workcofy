import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'

export const metadata: Metadata = {
  title: 'Workcofy | Encuentra dónde trabajar, reunirte y crear',
  description: 'Descubre cafés, work cafés y espacios de trabajo cerca de ti en Lima.',
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
