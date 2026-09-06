import type { MetadataRoute } from 'next'
import { SPACE_CATEGORY_SLUGS } from '@/lib/categories'
import { COURSE_CATEGORIES } from '@/lib/courses/constants'
import { listSpaces } from '@/lib/data/spaces'
import { listPublishedOpportunitySlugs } from '@/lib/data/opportunities'
import { OPPORTUNITY_CATEGORY_SLUGS } from '@/lib/opportunities/constants'
import { PROFESSION_VALUES } from '@/lib/professions'

export const dynamic = 'force-dynamic'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com').replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()
  const staticPaths = [
    '/',
    '/oportunidades',
    '/aprende',
    '/espacios',
    '/terminos',
    '/privacidad',
    ...OPPORTUNITY_CATEGORY_SLUGS.map((c) => `/oportunidades/${c.slug}`),
    ...COURSE_CATEGORIES.map((c) => `/aprende/${c.slug}`),
    ...PROFESSION_VALUES.filter((v) => v !== 'otros').map((v) => `/aprende/ia-para-${v}`),
    ...SPACE_CATEGORY_SLUGS.map((c) => `/espacios/${c.slug}`),
  ]
  const [opportunities, spaces] = await Promise.all([
    listPublishedOpportunitySlugs().catch(() => []),
    listSpaces().catch(() => []),
  ])

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: now })),
    ...opportunities.map((row) => ({ url: `${base}/oportunidades/${row.slug}`, lastModified: new Date(row.updated_at) })),
    ...spaces.map((space) => ({ url: `${base}/spaces/${space.slug}`, lastModified: now })),
  ]
}
