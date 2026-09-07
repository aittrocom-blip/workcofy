/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'maps.googleapis.com' }],
  },
  async redirects() {
    // /near-me was the Espacios URL before the 2026-09 repositioning.
    return [{ source: '/near-me', destination: '/espacios', permanent: true }]
  },
  // Baseline hardening headers — deliberately no Content-Security-Policy here
  // yet: this app loads the Google Maps JS SDK, Supabase, and Google Fonts,
  // and a CSP needs to be built and tested against all of those before it's
  // safe to ship (a wrong CSP silently breaks the map/auth instead of erroring).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Geolocation stays allowed (self) — the Espacios map's "Cerca de
          // mí" depends on it. Camera/microphone are never used, so denied.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
}

export default nextConfig
