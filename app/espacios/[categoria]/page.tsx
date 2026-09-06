import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { spaceCategoryFromSlug } from '@/lib/categories'
import { listSpaces } from '@/lib/data/spaces'
import { isCurrentUserAdmin } from '@/lib/admin/isCurrentUserAdmin'
import { EspaciosDashboard } from '@/components/discovery/EspaciosDashboard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { categoria: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) return {}
  return { title: `${category.title} | Workcofy`, description: category.description }
}

// Same dashboard as /espacios with the category pre-selected — a crawlable
// URL per space type, reusing the list-first shell unchanged.
export default async function EspaciosCategoriaPage({ params }: PageProps) {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) notFound()
  const [spaces, isAdmin] = await Promise.all([listSpaces(), isCurrentUserAdmin()])
  return <EspaciosDashboard spaces={spaces} isAdmin={isAdmin} initialCategory={category.value} />
}
