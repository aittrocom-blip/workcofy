import { listPublishedCourses } from '@/lib/data/courses'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from '@/lib/courses/constants'
import {
  COURSE_SORT_OPTIONS,
  courseFiltersToParams,
  hasActiveCourseFilters,
  parseCourseFilters,
  type CourseFilters,
} from '@/lib/courses/queryBuilder'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import type { ChipGroup } from '@/components/ui/FilterChips'
import { FilterDropdowns } from '@/components/ui/FilterDropdowns'
import { SearchForm } from '@/components/ui/SearchForm'
import { CourseCard } from './CourseCard'

interface CoursesListingProps {
  basePath: string
  /** Filters baked into the route (category pages, ia-para-<area>); URL params refine within them. */
  fixed: CourseFilters
  searchParams: SearchParamsInput
  /** Shown above the results when the page has no hero of its own (category pages). */
  compactSearch?: boolean
  /** Anchor id so hero CTAs can scroll here. */
  id?: string
}

const CERTIFICATE_OPTIONS = [{ value: '1', label: 'Con certificado' }]

// Results block shared by /aprende and /aprende/[slug]: count, sort,
// compact filters and the grid. Search, categories and the discovery
// sections live in the page components around it.
export async function CoursesListing({ basePath, fixed, searchParams, compactSearch = false, id }: CoursesListingProps) {
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

  const clearHref = hasActiveCourseFilters(filters, fixed) ? basePath : null
  const sortHidden = Object.entries(current).filter(([key]) => key !== 'orden')

  return (
    <section id={id} className="scroll-mt-24">
      {compactSearch && (
        <div className="mb-5 max-w-2xl">
          <SearchForm basePath={basePath} current={current} placeholder="Buscar cursos, herramientas o habilidades..." />
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-gray-700">
          <span className="font-bold text-black">{courses.length}</span> {courses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
          {filters.q && (
            <span className="text-gray-500">
              {' '}
              para “{filters.q}”
            </span>
          )}
        </p>
        <form action={basePath} method="get" className="flex items-center gap-2">
          {sortHidden.map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Ordenar por</span>
            <select
              name="orden"
              defaultValue={filters.sort ?? 'relevant'}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-black"
            >
              {COURSE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black">
            Aplicar
          </button>
        </form>
      </div>

      <div className="mt-4">
        <FilterDropdowns basePath={basePath} current={current} groups={groups} clearHref={clearHref} />
      </div>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold">No encontramos cursos con esa búsqueda</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con otra palabra o con menos filtros.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  )
}
