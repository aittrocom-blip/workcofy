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

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-3">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight">
            <Link href={detailUrl} className="hover:underline">
              {opportunity.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-gray-500">{opportunity.company}</p>
        </div>
        {opportunity.is_ai && (
          <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">IA</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className={CHIP}>
            {chip}
          </span>
        ))}
        {area && <span className={CHIP}>{area}</span>}
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {opportunity.location ?? 'Sin ubicación'}
        {opportunity.salary_text && <span className="text-gray-400"> · {opportunity.salary_text}</span>}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-xs text-gray-400">
          {formatRelativeDays(opportunity.published_at, now)} · {optionLabel(OPPORTUNITY_SOURCES, opportunity.source)}
        </span>
        <a
          href={`/ir/oportunidad/${opportunity.id}`}
          target="_blank"
          rel="noopener"
          className="whitespace-nowrap rounded-full border border-black bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]"
        >
          Ver oportunidad
        </a>
      </div>
    </article>
  )
}
