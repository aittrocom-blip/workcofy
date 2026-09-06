import { isProfessionValue } from '@/lib/professions'
import { EXPERIENCE_LEVELS, OPPORTUNITY_COUNTRIES, OPPORTUNITY_MODALITIES, OPPORTUNITY_TYPES } from './constants'

export const OPPORTUNITY_PAGE_SIZE = 30

export const OPPORTUNITY_SORT_OPTIONS = ['recent', 'relevant'] as const
export type OpportunitySort = (typeof OPPORTUNITY_SORT_OPTIONS)[number]

export interface OpportunityFilters {
  q?: string | null
  type?: string | null
  modality?: string | null
  level?: string | null
  area?: string | null
  country?: string | null
  ai?: boolean | null
  sort?: OpportunitySort | null
  page?: number
}

export type SearchParamsInput = Record<string, string | string[] | undefined>

export function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

// URL params are Spanish (they show in the address bar); the filter object
// uses the names the data layer speaks.
export function parseOpportunityFilters(params: SearchParamsInput): OpportunityFilters {
  const page = Number.parseInt(firstParam(params.page) ?? '1', 10)
  const ia = firstParam(params.ia)
  const sort = firstParam(params.orden)
  return {
    q: firstParam(params.q),
    type: firstParam(params.tipo),
    modality: firstParam(params.modalidad),
    level: firstParam(params.nivel),
    area: firstParam(params.area),
    country: firstParam(params.pais),
    ai: ia === '1' ? true : ia === '0' ? false : null,
    sort: sort === 'recent' || sort === 'relevant' ? sort : 'recent',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function opportunityFiltersToParams(filters: OpportunityFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.q) out.q = filters.q
  if (filters.type) out.tipo = filters.type
  if (filters.modality) out.modalidad = filters.modality
  if (filters.level) out.nivel = filters.level
  if (filters.area) out.area = filters.area
  if (filters.country) out.pais = filters.country
  if (filters.ai === true) out.ia = '1'
  else if (filters.ai === false) out.ia = '0'
  if (filters.sort && filters.sort !== 'recent') out.orden = filters.sort
  if (filters.page && filters.page > 1) out.page = String(filters.page)
  return out
}

export interface OpportunityEqFilter {
  column: 'type' | 'modality' | 'experience_level' | 'area' | 'country'
  value: string
}

export interface OpportunityQueryDescriptor {
  eqFilters: OpportunityEqFilter[]
  isAi: boolean | null
  searchTerm: string | null
  sort: OpportunitySort
  page: number
  from: number
  to: number
}

const TYPE_VALUES = new Set<string>(OPPORTUNITY_TYPES.map((o) => o.value))
const MODALITY_VALUES = new Set<string>(OPPORTUNITY_MODALITIES.map((o) => o.value))
const LEVEL_VALUES = new Set<string>(EXPERIENCE_LEVELS.map((o) => o.value))
const COUNTRY_VALUES = new Set<string>(OPPORTUNITY_COUNTRIES.map((o) => o.value))

// Unknown values are ignored rather than rejected: a stale or hand-typed
// URL degrades to a broader list instead of an error page.
export function buildOpportunityQueryDescriptor(filters: OpportunityFilters): OpportunityQueryDescriptor {
  const eqFilters: OpportunityEqFilter[] = []
  if (filters.type && TYPE_VALUES.has(filters.type)) eqFilters.push({ column: 'type', value: filters.type })
  if (filters.modality && MODALITY_VALUES.has(filters.modality)) eqFilters.push({ column: 'modality', value: filters.modality })
  if (filters.level && LEVEL_VALUES.has(filters.level)) eqFilters.push({ column: 'experience_level', value: filters.level })
  if (filters.area && isProfessionValue(filters.area)) eqFilters.push({ column: 'area', value: filters.area })
  if (filters.country && COUNTRY_VALUES.has(filters.country)) eqFilters.push({ column: 'country', value: filters.country })

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const from = (page - 1) * OPPORTUNITY_PAGE_SIZE
  const trimmed = filters.q?.trim()
  const sort: OpportunitySort = filters.sort === 'relevant' ? 'relevant' : 'recent'

  return {
    eqFilters,
    isAi: filters.ai ?? null,
    searchTerm: trimmed ? trimmed : null,
    sort,
    page,
    from,
    to: from + OPPORTUNITY_PAGE_SIZE - 1,
  }
}

// True when the user narrowed the list beyond the route's own baked-in filters.
export function hasActiveOpportunityFilters(filters: OpportunityFilters, fixed: OpportunityFilters = {}): boolean {
  const keys: (keyof OpportunityFilters)[] = ['q', 'type', 'modality', 'level', 'area', 'country', 'ai']
  return keys.some((key) => {
    const value = filters[key]
    if (value === undefined || value === null || value === '') return false
    return fixed[key] === undefined || fixed[key] === null
  })
}
