import { isProfessionValue } from '@/lib/professions'
import { firstParam, type SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from './constants'

export interface CourseFilters {
  category?: string | null
  area?: string | null
  tool?: string | null
  level?: string | null
  price?: string | null
  language?: string | null
  certificate?: boolean | null
}

export function parseCourseFilters(params: SearchParamsInput): CourseFilters {
  return {
    category: firstParam(params.categoria),
    area: firstParam(params.area),
    tool: firstParam(params.herramienta),
    level: firstParam(params.nivel),
    price: firstParam(params.precio),
    language: firstParam(params.idioma),
    certificate: firstParam(params.certificado) === '1' ? true : null,
  }
}

export function courseFiltersToParams(filters: CourseFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.category) out.categoria = filters.category
  if (filters.area) out.area = filters.area
  if (filters.tool) out.herramienta = filters.tool
  if (filters.level) out.nivel = filters.level
  if (filters.price) out.precio = filters.price
  if (filters.language) out.idioma = filters.language
  if (filters.certificate) out.certificado = '1'
  return out
}

export interface CourseEqFilter {
  column: 'category' | 'area' | 'tool' | 'level' | 'price' | 'language'
  value: string
}

export interface CourseQueryDescriptor {
  eqFilters: CourseEqFilter[]
  certificate: boolean | null
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
  return { eqFilters, certificate: filters.certificate ?? null }
}
