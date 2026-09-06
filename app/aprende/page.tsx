import type { Metadata } from 'next'
import { CoursesListing } from '@/components/courses/CoursesListing'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aprende IA aplicada al trabajo: cursos y certificaciones oficiales | Workcofy',
  description:
    'Cursos y certificaciones oficiales de Anthropic, OpenAI, Google, Microsoft, AWS y más para usar inteligencia artificial en tu trabajo.',
}

export default function AprendePage({ searchParams }: { searchParams: SearchParamsInput }) {
  return (
    <CoursesListing
      basePath="/aprende"
      fixed={{}}
      heading="Aprende"
      intro="Cursos y certificaciones oficiales para usar la inteligencia artificial en tu trabajo. Curados por Workcofy, dictados por quienes crean las herramientas."
      searchParams={searchParams}
    />
  )
}
