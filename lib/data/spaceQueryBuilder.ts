export interface SpaceFilters {
  country?: string | null
  district?: string | null
  category?: string | null
  search?: string | null
}

export interface SpaceQueryFilter {
  column: 'country' | 'district' | 'category'
  value: string
}

export interface SpaceQueryDescriptor {
  eqFilters: SpaceQueryFilter[]
  searchTerm: string | null
}

export function buildSpaceQueryDescriptor(filters: SpaceFilters): SpaceQueryDescriptor {
  const eqFilters: SpaceQueryFilter[] = []
  if (filters.country) eqFilters.push({ column: 'country', value: filters.country })
  if (filters.district) eqFilters.push({ column: 'district', value: filters.district })
  if (filters.category) eqFilters.push({ column: 'category', value: filters.category })

  const trimmedSearch = filters.search?.trim()

  return { eqFilters, searchTerm: trimmedSearch ? trimmedSearch : null }
}
