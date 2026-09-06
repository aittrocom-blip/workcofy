import { listPublishedCourses } from '@/lib/data/courses'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from '@/lib/courses/constants'
import { courseFiltersToParams, parseCourseFilters, type CourseFilters } from '@/lib/courses/queryBuilder'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import { CategoryTabs } from '@/components/ui/CategoryTabs'
import { FilterChips, type ChipGroup } from '@/components/ui/FilterChips'
import { CourseCard } from './CourseCard'

interface CoursesListingProps {
  basePath: string
  /** Filters baked into the route (category pages, ia-para-<area>); URL params refine within them. */
  fixed: CourseFilters
  heading: string
  intro: string
  searchParams: SearchParamsInput
}

const CERTIFICATE_OPTIONS = [{ value: '1', label: 'Con certificado' }]

export async function CoursesListing({ basePath, fixed, heading, intro, searchParams }: CoursesListingProps) {
  const filters = parseCourseFilters(searchParams)
  const effective: CourseFilters = { ...filters, ...fixed }
  const current = courseFiltersToParams(filters)
  const courses = await listPublishedCourses(effective)

  const groups: ChipGroup[] = []
  if (!fixed.category) groups.push({ label: 'Categoría', param: 'categoria', options: COURSE_CATEGORIES, allLabel: 'Todas' })
  if (!fixed.area) groups.push({ label: 'Área', param: 'area', options: PROFESSION_OPTIONS, allLabel: 'Todas' })
  groups.push({ label: 'Herramienta', param: 'herramienta', options: COURSE_TOOLS, allLabel: 'Todas' })
  groups.push({ label: 'Nivel', param: 'nivel', options: COURSE_LEVELS })
  groups.push({ label: 'Precio', param: 'precio', options: COURSE_PRICES })
  groups.push({ label: 'Idioma', param: 'idioma', options: COURSE_LANGUAGES })
  groups.push({ label: 'Certificado', param: 'certificado', options: CERTIFICATE_OPTIONS, allLabel: 'Indistinto' })

  const tabs = [
    { href: '/aprende', label: 'Todos' },
    ...COURSE_CATEGORIES.map((category) => ({ href: `/aprende/${category.slug}`, label: category.label })),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{heading}</h1>
      <p className="mt-2 max-w-2xl text-gray-500">{intro}</p>

      <div className="mt-6">
        <CategoryTabs items={tabs} activeHref={basePath} />
      </div>
      <div className="mt-4">
        <FilterChips basePath={basePath} current={current} groups={groups} />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
      </p>

      {courses.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold">No hay cursos con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
