import type { Metadata } from 'next'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Oportunidades de trabajo remoto, freelance y prácticas | Workcofy',
  description:
    'Descubre trabajos remotos, proyectos freelance, prácticas y oportunidades en IA para Perú, LatAm y el mundo.',
}

export default function OportunidadesPage({ searchParams }: { searchParams: SearchParamsInput }) {
  return <OpportunitiesListing basePath="/oportunidades" category={null} searchParams={searchParams} />
}
