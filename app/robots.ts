import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com').replace(/\/$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/ir/', '/perfil', '/favoritos', '/auth/'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
