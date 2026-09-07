import Link from 'next/link'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import type { CourseRecord } from '@/lib/data/courseTypes'
import { OPPORTUNITY_TYPES } from '@/lib/opportunities/constants'
import { courseCategoryFromValue, coursePriceDisplay } from '@/lib/courses/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { formatRelativeDays } from '@/lib/text/relativeDays'
import { CompanyLogo } from '@/components/opportunities/OpportunityCard'
import { ProviderLogo } from '@/components/courses/ProviderLogo'

// Compact, strip-sized versions of OpportunityCard / CourseCard for the
// Explorar home — enough to recognise and tap, the full card lives on the
// section pages.
export function OpportunityTile({ opportunity, now }: { opportunity: OpportunityRecord; now: Date }) {
  const type = optionLabel(OPPORTUNITY_TYPES, opportunity.type)
  const area = professionLabel(opportunity.area)
  return (
    <Link
      href={`/oportunidades/${opportunity.slug}`}
      className="flex w-[240px] flex-none flex-col rounded-[20px] border border-gray-100 bg-white p-3.5 transition-colors active:bg-gray-50"
    >
      <div className="flex items-center gap-2.5">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} className="h-9 w-9" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-500">{opportunity.company}</span>
        {opportunity.is_ai && <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[10px] font-bold">IA ✦</span>}
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{opportunity.title}</p>
      <p className="mt-auto pt-2 text-xs text-gray-500">
        {[type, area].filter(Boolean).join(' · ')}
        <span className="text-gray-300"> · </span>
        {formatRelativeDays(opportunity.published_at, now).toLowerCase()}
      </p>
    </Link>
  )
}

export function CourseTile({ course }: { course: CourseRecord }) {
  const price = coursePriceDisplay(course.price, course.price_text)
  const category = courseCategoryFromValue(course.category)
  return (
    <Link
      href={`/aprende/${course.slug}`}
      className="flex w-[220px] flex-none flex-col rounded-[20px] border border-gray-100 bg-white p-3.5 transition-colors active:bg-gray-50"
    >
      <div className="flex items-center gap-2.5">
        <ProviderLogo provider={course.provider} courseUrl={course.url} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{course.provider}</span>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{course.title}</p>
      <p className="mt-auto flex items-center gap-2 pt-2 text-xs text-gray-500">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            course.price === 'gratis' ? 'bg-workcofy-green/10 text-workcofy-green' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {price.label}
        </span>
        <span className="truncate">{category?.label}</span>
      </p>
    </Link>
  )
}
