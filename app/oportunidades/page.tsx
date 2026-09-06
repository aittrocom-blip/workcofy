import type { Metadata } from 'next'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Oportunidades de trabajo remoto y freelance | Workcofy',
  description: 'Descubre trabajos remotos, oportunidades freelance, proyectos y prácticas de Perú, Latinoamérica y el mundo.',
}

export default function OportunidadesPage({ searchParams }: { searchParams: SearchParamsInput }) {
  return <OpportunitiesListing basePath="/oportunidades" category={null} searchParams={searchParams} />
}
