import Link from 'next/link'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import {
  EXPERIENCE_LEVELS,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_SOURCES,
  OPPORTUNITY_TYPES,
} from '@/lib/opportunities/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { formatRelativeDays } from '@/lib/text/relativeDays'

interface OpportunityCardProps {
  opportunity: OpportunityRecord
  now?: Date
}

const CHIP = 'rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700'

export function CompanyLogo({
  name,
  logoUrl,
  className = 'h-10 w-10',
}: {
  name: string
  logoUrl: string | null
  className?: string
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className={`${className} flex-none rounded-xl border border-gray-100 bg-white object-contain`} />
  }
  return (
    <span
      className={`${className} flex flex-none items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function OpportunityCard({ opportunity, now = new Date() }: OpportunityCardProps) {
  const detailUrl = `/oportunidades/${opportunity.slug}`
  const chips = [
    optionLabel(OPPORTUNITY_TYPES, opportunity.type),
    optionLabel(OPPORTUNITY_MODALITIES, opportunity.modality),
    optionLabel(EXPERIENCE_LEVELS, opportunity.experience_level),
  ].filter((label): label is string => label !== null)
  const area = professionLabel(opportunity.area)
  const source = optionLabel(OPPORTUNITY_SOURCES, opportunity.source)
  const tags = (opportunity.tags ?? []).slice(0, 3)

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-gray-200 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-500">{opportunity.company}</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight tracking-tight text-black">
              <Link href={detailUrl} className="hover:underline">
                {opportunity.title}
              </Link>
            </h3>
          </div>
        </div>
        {opportunity.is_ai && (
          <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">IA ✦</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className={CHIP}>
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
        {area && <span className="font-medium text-gray-700">{area}</span>}
        {tags.length > 0 && <span className="text-gray-300">•</span>}
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {opportunity.location ?? 'Sin ubicación'}
        {opportunity.salary_text && <span className="text-gray-400"> · {opportunity.salary_text}</span>}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500">
            {formatRelativeDays(opportunity.published_at, now)} · Fuente: {source}
          </span>
          <a
            href={`/ir/oportunidad/${opportunity.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black active:scale-[0.97]"
          >
            Ver oportunidad <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  )
}
