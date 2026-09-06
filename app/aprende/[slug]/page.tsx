import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CoursesListing } from '@/components/courses/CoursesListing'
import { resolveCourseSlug } from '@/lib/courses/resolveCourseSlug'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: SearchParamsInput
}

export function generateMetadata({ params }: PageProps): Metadata {
  const resolved = resolveCourseSlug(params.slug)
  if (!resolved) return {}
  return { title: `${resolved.title} | Workcofy`, description: resolved.description }
}

export default function AprendeSlugPage({ params, searchParams }: PageProps) {
  const resolved = resolveCourseSlug(params.slug)
  if (!resolved) notFound()
  return (
    <CoursesListing
      basePath={`/aprende/${params.slug}`}
      fixed={resolved.filters}
      heading={resolved.title}
      intro={resolved.description}
      searchParams={searchParams}
    />
  )
}
