import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { spaceCategoryFromSlug } from '@/lib/categories'
import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { categoria: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) return {}
  return { title: `${category.title} | Workcofy`, description: category.description }
}

// Same full-screen map as /espacios, pre-filtered server-side to one
// category — a crawlable URL per space type.
export default async function EspaciosCategoriaPage({ params }: PageProps) {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) notFound()
  const spaces = await listSpaces({ category: [category.value] })
  return <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
}
