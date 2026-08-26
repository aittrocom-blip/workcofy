export type SortOption = 'distance' | 'rating' | 'open_now'

export interface DiscoveryFilterState {
  district: string | null
  category: string | null
  search: string | null
  sort: SortOption
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilterState = {
  district: null,
  category: null,
  search: null,
  sort: 'rating',
}

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilterState {
  return {
    district: params.get('district'),
    category: params.get('category'),
    search: params.get('q'),
    sort: (params.get('sort') as SortOption) || DEFAULT_DISCOVERY_FILTERS.sort,
  }
}

export function serializeDiscoveryFilters(state: Partial<DiscoveryFilterState>): string {
  const params = new URLSearchParams()
  if (state.district) params.set('district', state.district)
  if (state.category) params.set('category', state.category)
  if (state.search) params.set('q', state.search)
  if (state.sort) params.set('sort', state.sort)
  return params.toString()
}
