import type { Metadata } from 'next'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import { OportunidadesHero } from '@/components/opportunities/OportunidadesHero'
import { QuickCategories } from '@/components/opportunities/QuickCategories'
import { firstParam, type SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Oportunidades de trabajo remoto y freelance | Workcofy',
  description: 'Descubre trabajos remotos, oportunidades freelance, proyectos y prácticas de Perú, Latinoamérica y el mundo.',
}

export default async function OportunidadesPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const { data: { user } } = await (await import('@/lib/supabase/server')).createServerSupabaseClient().auth.getUser()
  const publicPreview = !user
  return (
    <div>
      <OportunidadesHero currentQuery={firstParam(searchParams.q)} />
      <QuickCategories activeHref="/oportunidades" />
      <OpportunitiesListing id="oportunidades" basePath="/oportunidades" category={null} searchParams={searchParams} publicPreview={publicPreview} />
    </div>
  )
}
