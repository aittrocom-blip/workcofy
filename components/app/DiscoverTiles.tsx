import Link from 'next/link'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import type { CourseRecord } from '@/lib/data/courseTypes'
import { OPPORTUNITY_TYPES } from '@/lib/opportunities/constants'
import { COURSE_LEVELS, courseCategoryFromValue } from '@/lib/courses/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { formatRelativeDays } from '@/lib/text/relativeDays'
import { CompanyLogo } from '@/components/opportunities/OpportunityCard'
import { ProviderLogo } from '@/components/courses/ProviderLogo'

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000

const CARD_CLASS =
  'flex w-[240px] flex-none flex-col rounded-[20px] border border-gray-200 bg-white p-4 transition-colors active:bg-gray-50'
const CORNER_BADGE = {
  green: 'bg-workcofy-green/10 text-workcofy-green',
  yellow: 'bg-workcofy-yellow/25 text-black',
  blue: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
}

function CornerBadge({ label, tone }: { label: string; tone: keyof typeof CORNER_BADGE }) {
  return <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ${CORNER_BADGE[tone]}`}>{label}</span>
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.6 3H5a2 2 0 0 0-2 2v6.6c0 .53.21 1.04.59 1.41l9 9a2 2 0 0 0 2.82 0l6.6-6.6a2 2 0 0 0 0-2.82l-9-9A2 2 0 0 0 11.6 3Z" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

function MetaRow({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">{children}</p>
}

// Compact, strip-sized versions of OpportunityCard / CourseCard for the
// Explorar home — enough to recognise and scan in a couple seconds; the
// full card with description and apply button lives on the section pages.
export function OpportunityTile({ opportunity, now }: { opportunity: OpportunityRecord; now: Date }) {
  const type = optionLabel(OPPORTUNITY_TYPES, opportunity.type)
  const area = professionLabel(opportunity.area)
  const isNew = now.getTime() - new Date(opportunity.published_at).getTime() < NEW_WINDOW_MS
  const badge = isNew
    ? { label: 'Nuevo', tone: 'green' as const }
    : opportunity.modality === 'remoto'
      ? { label: '100% remoto', tone: 'yellow' as const }
      : opportunity.is_ai
        ? { label: 'Destacado', tone: 'yellow' as const }
        : null

  return (
    <Link href={`/oportunidades/${opportunity.slug}`} className={CARD_CLASS}>
      <div className="flex items-start gap-2.5">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} className="h-9 w-9" />
        <span className="min-w-0 flex-1 truncate pt-1.5 text-xs font-semibold text-gray-500">{opportunity.company}</span>
        {badge && <CornerBadge label={badge.label} tone={badge.tone} />}
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{opportunity.title}</p>
      <div className="mt-auto pt-2">
        <MetaRow>
          <TagIcon />
          <span className="truncate">{[type, area].filter(Boolean).join(' · ')}</span>
        </MetaRow>
        <MetaRow>
          <ClockIcon />
          Publicado {formatRelativeDays(opportunity.published_at, now).toLowerCase()}
        </MetaRow>
      </div>
    </Link>
  )
}

export function CourseTile({ course }: { course: CourseRecord }) {
  const category = courseCategoryFromValue(course.category)
  const level = optionLabel(COURSE_LEVELS, course.level)
  const badge = course.has_certificate
    ? { label: 'Certificado', tone: 'blue' as const }
    : course.price === 'gratis'
      ? { label: 'Gratis', tone: 'green' as const }
      : { label: 'Pago', tone: 'gray' as const }

  return (
    <Link href={`/ir/curso/${course.id}`} target="_blank" rel="noopener" className={CARD_CLASS}>
      <div className="flex items-start gap-2.5">
        <ProviderLogo provider={course.provider} courseUrl={course.url} />
        <span className="min-w-0 flex-1 truncate pt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{course.provider}</span>
        <CornerBadge label={badge.label} tone={badge.tone} />
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{course.title}</p>
      <div className="mt-auto pt-2">
        <MetaRow>
          <TagIcon />
          <span className="truncate">{[category?.label, level].filter(Boolean).join(' · ')}</span>
        </MetaRow>
        {course.duration_text && (
          <MetaRow>
            <ClockIcon />
            {course.duration_text}
          </MetaRow>
        )}
        {course.tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-500">
                {tag}
              </span>
            ))}
          </p>
        )}
      </div>
    </Link>
  )
}
