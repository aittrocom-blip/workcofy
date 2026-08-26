export interface SpaceFilters {
  district?: string | null
  category?: string | null
  search?: string | null
}

export interface SpaceQueryFilter {
  column: 'district' | 'category'
  value: string
}

export interface SpaceQueryDescriptor {
  eqFilters: SpaceQueryFilter[]
  searchTerm: string | null
}

export function buildSpaceQueryDescriptor(filters: SpaceFilters): SpaceQueryDescriptor {
  const eqFilters: SpaceQueryFilter[] = []
  if (filters.district) eqFilters.push({ column: 'district', value: filters.district })
  if (filters.category) eqFilters.push({ column: 'category', value: filters.category })

  const trimmedSearch = filters.search?.trim()

  return { eqFilters, searchTerm: trimmedSearch ? trimmedSearch : null }
}
