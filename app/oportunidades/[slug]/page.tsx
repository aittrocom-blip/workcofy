import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail'
import { QuickCategories } from '@/components/opportunities/QuickCategories'
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
    const basePath = `/oportunidades/${category.slug}`
    return (
      <div>
        <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
          <Link href="/oportunidades" className="text-sm text-gray-500 hover:text-black">
            ← Trabajos remotos
          </Link>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">{category.title}</h1>
          <p className="mt-3 max-w-xl text-gray-600 md:text-lg">{category.description}</p>
        </section>
        <QuickCategories activeHref={basePath} />
        <OpportunitiesListing id="oportunidades" basePath={basePath} category={category} searchParams={searchParams} />
      </div>
    )
  }
  const opportunity = await getOpportunityBySlug(params.slug)
  if (!opportunity) notFound()
  return <OpportunityDetail opportunity={opportunity} />
}
