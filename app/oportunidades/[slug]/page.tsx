import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail'
import { getOpportunityBySlug } from '@/lib/data/opportunities'
import { opportunityCategoryFromSlug } from '@/lib/opportunities/constants'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { truncateWords } from '@/lib/text/truncate'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: SearchParamsInput
}

// One dynamic segment serves both /oportunidades/remoto (a category view)
// and /oportunidades/<job-slug> (a detail page): categories are a fixed
// five-item list checked first, everything else is looked up as a job.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = opportunityCategoryFromSlug(params.slug)
  if (category) return { title: `${category.title} | Workcofy`, description: category.description }
  const opportunity = await getOpportunityBySlug(params.slug)
  if (!opportunity) return {}
  const title = `${opportunity.title} en ${opportunity.company} | Workcofy`
  const description = opportunity.summary ?? truncateWords(opportunity.description ?? '', 160)
  return { title, description, openGraph: { title, description } }
}

export default async function OportunidadSlugPage({ params, searchParams }: PageProps) {
  const category = opportunityCategoryFromSlug(params.slug)
  if (category) {
    return (
      <OpportunitiesListing basePath={`/oportunidades/${category.slug}`} category={category} searchParams={searchParams} />
    )
  }
  const opportunity = await getOpportunityBySlug(params.slug)
  if (!opportunity) notFound()
  return <OpportunityDetail opportunity={opportunity} />
}
