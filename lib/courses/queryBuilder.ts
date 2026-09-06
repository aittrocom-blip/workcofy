import { isProfessionValue } from '@/lib/professions'
import { firstParam, type SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from './constants'

export const COURSE_SORT_OPTIONS = [
  { value: 'relevant', label: 'Más relevantes' },
  { value: 'recent', label: 'Más recientes' },
] as const
export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number]['value']

export interface CourseFilters {
  q?: string | null
  category?: string | null
  area?: string | null
  tool?: string | null
  level?: string | null
  price?: string | null
  language?: string | null
  certificate?: boolean | null
  sort?: CourseSort | null
}

export function parseCourseFilters(params: SearchParamsInput): CourseFilters {
  const sort = firstParam(params.orden)
  return {
    q: firstParam(params.q),
    category: firstParam(params.categoria),
    area: firstParam(params.area),
    tool: firstParam(params.herramienta),
    level: firstParam(params.nivel),
    price: firstParam(params.precio),
    language: firstParam(params.idioma),
    certificate: firstParam(params.certificado) === '1' ? true : null,
    sort: sort === 'recent' ? 'recent' : 'relevant',
  }
}

export function courseFiltersToParams(filters: CourseFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.q) out.q = filters.q
  if (filters.category) out.categoria = filters.category
  if (filters.area) out.area = filters.area
  if (filters.tool) out.herramienta = filters.tool
  if (filters.level) out.nivel = filters.level
  if (filters.price) out.precio = filters.price
  if (filters.language) out.idioma = filters.language
  if (filters.certificate) out.certificado = '1'
  if (filters.sort === 'recent') out.orden = 'recent'
  return out
}

export interface CourseEqFilter {
  column: 'category' | 'area' | 'tool' | 'level' | 'price' | 'language'
  value: string
}

export interface CourseQueryDescriptor {
  eqFilters: CourseEqFilter[]
  certificate: boolean | null
  searchTerm: string | null
  sort: CourseSort
}

const valid = (options: readonly { value: string }[]) => new Set<string>(options.map((o) => o.value))
const CATEGORY_VALUES = valid(COURSE_CATEGORIES)
const TOOL_VALUES = valid(COURSE_TOOLS)
const LEVEL_VALUES = valid(COURSE_LEVELS)
const PRICE_VALUES = valid(COURSE_PRICES)
const LANGUAGE_VALUES = valid(COURSE_LANGUAGES)

export function buildCourseQueryDescriptor(filters: CourseFilters): CourseQueryDescriptor {
  const eqFilters: CourseEqFilter[] = []
  if (filters.category && CATEGORY_VALUES.has(filters.category)) eqFilters.push({ column: 'category', value: filters.category })
  if (filters.area && isProfessionValue(filters.area)) eqFilters.push({ column: 'area', value: filters.area })
  if (filters.tool && TOOL_VALUES.has(filters.tool)) eqFilters.push({ column: 'tool', value: filters.tool })
  if (filters.level && LEVEL_VALUES.has(filters.level)) eqFilters.push({ column: 'level', value: filters.level })
  if (filters.price && PRICE_VALUES.has(filters.price)) eqFilters.push({ column: 'price', value: filters.price })
  if (filters.language && LANGUAGE_VALUES.has(filters.language)) eqFilters.push({ column: 'language', value: filters.language })
  const trimmed = filters.q?.trim()
  return {
    eqFilters,
    certificate: filters.certificate ?? null,
    searchTerm: trimmed ? trimmed : null,
    sort: filters.sort === 'recent' ? 'recent' : 'relevant',
  }
}

// True when the user narrowed the list beyond the route's own baked-in filters.
export function hasActiveCourseFilters(filters: CourseFilters, fixed: CourseFilters = {}): boolean {
  const keys: (keyof CourseFilters)[] = ['q', 'category', 'area', 'tool', 'level', 'price', 'language', 'certificate']
  return keys.some((key) => Boolean(filters[key]) && !fixed[key])
}
