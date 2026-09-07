import Link from 'next/link'
import { countPublishedOpportunities, listRecentOpportunities } from '@/lib/data/opportunities'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'

// Master spec §33: the three most recent published opportunities.
export async function OpportunitiesHomeSection() {
  // The Home must never break because one block's query fails (e.g. the
  // table isn't migrated yet on a fresh environment) — degrade to nothing.
  const [opportunities, total] = await Promise.all([
    listRecentOpportunities(3).catch((error: unknown) => {
      console.warn('OpportunitiesHomeSection: could not load opportunities', error)
      return []
    }),
    countPublishedOpportunities().catch(() => 0),
  ])
  if (opportunities.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Trabajos remotos</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Nuevas oportunidades</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      <Link
        href="/oportunidades"
        className="mt-8 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
      >
        Ver todas las oportunidades{total > 0 && ` (${total})`}
      </Link>
    </section>
  )
}
