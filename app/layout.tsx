import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workcofy',
  description: 'Encuentra dónde trabajar, reunirte y crear.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
