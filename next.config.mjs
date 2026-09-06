/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'maps.googleapis.com' }],
  },
  async redirects() {
    // /near-me was the Espacios URL before the 2026-09 repositioning.
    return [{ source: '/near-me', destination: '/espacios', permanent: true }]
  },
}

export default nextConfig
