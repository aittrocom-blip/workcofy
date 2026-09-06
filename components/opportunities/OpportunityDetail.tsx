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
import { CompanyLogo } from './OpportunityCard'

const CHIP = 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700'

export function OpportunityDetail({ opportunity }: { opportunity: OpportunityRecord }) {
  const chips = [
    optionLabel(OPPORTUNITY_TYPES, opportunity.type),
    optionLabel(OPPORTUNITY_MODALITIES, opportunity.modality),
    optionLabel(EXPERIENCE_LEVELS, opportunity.experience_level),
    professionLabel(opportunity.area),
  ].filter((label): label is string => label !== null)
  const source = optionLabel(OPPORTUNITY_SOURCES, opportunity.source)
  const paragraphs = (opportunity.description ?? '').split('\n\n').filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-14">
      <Link href="/oportunidades" className="text-sm text-gray-500 hover:text-black">
        ← Todas las oportunidades
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} className="h-14 w-14" />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{opportunity.title}</h1>
          <p className="mt-1 text-gray-600">{opportunity.company}</p>
        </div>
        {opportunity.is_ai && (
          <span className="ml-auto flex-none rounded-full bg-workcofy-yellow px-2.5 py-1 text-xs font-bold">IA</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className={CHIP}>
            {chip}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-400">Ubicación</dt>
          <dd className="font-medium">{opportunity.location ?? 'Sin ubicación'}</dd>
        </div>
        {opportunity.salary_text && (
          <div>
            <dt className="text-gray-400">Salario</dt>
            <dd className="font-medium">{opportunity.salary_text}</dd>
          </div>
        )}
        <div>
          <dt className="text-gray-400">Publicada</dt>
          <dd className="font-medium">{formatRelativeDays(opportunity.published_at)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Fuente</dt>
          <dd className="font-medium">{source}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={`/ir/oportunidad/${opportunity.id}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
        >
          Ver oportunidad en {source}
        </a>
        <span className="text-xs text-gray-400">La postulación se realiza en el sitio original.</span>
      </div>

      {paragraphs.length > 0 && (
        <div className="mt-10 flex flex-col gap-4 text-sm leading-relaxed text-gray-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
