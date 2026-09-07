import type { MetadataRoute } from 'next'

// Lets "Add to Home Screen" install Workcofy as a standalone app that opens
// straight into Explorar. Uses the existing app/icon.png (the solo mark).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Workcofy',
    short_name: 'Workcofy',
    description: 'Work anywhere. Work better.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'es',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  }
}
