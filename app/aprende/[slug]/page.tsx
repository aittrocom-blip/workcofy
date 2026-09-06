import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CategoryCards } from '@/components/courses/CategoryCards'
import { CoursesListing } from '@/components/courses/CoursesListing'
import { LearningPaths } from '@/components/courses/LearningPaths'
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
  return { title: `${resolved.title} | Aprende | Workcofy`, description: resolved.description }
}

// Category and "ia-para-<area>" collections: a compact header instead of
// the full hero, then the same results block and discovery sections.
export default function AprendeSlugPage({ params, searchParams }: PageProps) {
  const resolved = resolveCourseSlug(params.slug)
  if (!resolved) notFound()
  const basePath = `/aprende/${params.slug}`
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
        <Link href="/aprende" className="text-sm text-gray-500 hover:text-black">
          ← Aprende
        </Link>
        <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">{resolved.title}</h1>
        <p className="mt-3 max-w-xl text-gray-600 md:text-lg">{resolved.description}</p>
      </section>
      <CategoryCards activeHref={basePath} />
      <div className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
        <CoursesListing id="cursos" basePath={basePath} fixed={resolved.filters} searchParams={searchParams} compactSearch />
      </div>
      <LearningPaths />
    </div>
  )
}
