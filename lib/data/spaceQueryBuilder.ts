export interface SpaceFilters {
  country?: string | null
  district?: string | null
  /** Zero, one, or several category values — empty/undefined means no category filter. */
  category?: string[] | null
  search?: string | null
}

export interface SpaceQueryFilter {
  column: 'country' | 'district'
  value: string
}

export interface SpaceQueryDescriptor {
  eqFilters: SpaceQueryFilter[]
  /** Non-null means "narrow to these categories" (`.in('category', categoryIn)`); null means no category filter. */
  categoryIn: string[] | null
  searchTerm: string | null
}

export function buildSpaceQueryDescriptor(filters: SpaceFilters): SpaceQueryDescriptor {
  const eqFilters: SpaceQueryFilter[] = []
  if (filters.country) eqFilters.push({ column: 'country', value: filters.country })
  if (filters.district) eqFilters.push({ column: 'district', value: filters.district })

  const categoryIn = filters.category && filters.category.length > 0 ? filters.category : null
  const trimmedSearch = filters.search?.trim()

  return { eqFilters, categoryIn, searchTerm: trimmedSearch ? trimmedSearch : null }
}
