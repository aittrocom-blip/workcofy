import type { Metadata } from 'next'
import { AprendeHero } from '@/components/courses/AprendeHero'
import { CategoryCards } from '@/components/courses/CategoryCards'
import { CoursesListing } from '@/components/courses/CoursesListing'
import { LearningPaths } from '@/components/courses/LearningPaths'
import { PopularTopics } from '@/components/courses/PopularTopics'
import { firstParam, type SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aprende IA y nuevas habilidades | Workcofy',
  description:
    'Descubre cursos, herramientas y certificaciones para aprender inteligencia artificial y desarrollar nuevas habilidades para el trabajo.',
}

export default function AprendePage({ searchParams }: { searchParams: SearchParamsInput }) {
  return (
    <div>
      <AprendeHero currentQuery={firstParam(searchParams.q)} />
      <CategoryCards activeHref="/aprende" />
      <PopularTopics />
      <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
        <CoursesListing id="cursos" basePath="/aprende" fixed={{}} searchParams={searchParams} />
      </div>
      <LearningPaths />
    </div>
  )
}
