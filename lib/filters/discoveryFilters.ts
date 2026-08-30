export type SortOption = 'distance' | 'rating' | 'workcofy_score' | 'popular' | 'open_now'

export interface DiscoveryFilterState {
  country: string | null
  district: string | null
  category: string | null
  search: string | null
  sort: SortOption
  // Independent filters, not sort orders — "abierto ahora" narrows the list,
  // it doesn't just reorder it, and "verificado" is a trust signal, not a
  // ranking criterion.
  openNow: boolean
  // Mutually exclusive with openNow — set by the "horario específico" option
  // in the same dropdown; both represent "how do you want to filter by
  // hours", never active together.
  openBetween: { start: string; end: string } | null
  verifiedOnly: boolean
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilterState = {
  country: null,
  district: null,
  category: null,
  search: null,
  // Distance-first: with spaces now spanning Lima and multiple Chilean
  // cities, ranking by rating alone surfaced far-away high-rated spaces
  // ahead of nearby ones. Falls back to insertion order until geolocation
  // resolves (see DiscoveryView's autoRequestLocation).
  sort: 'distance',
  openNow: false,
  openBetween: null,
  verifiedOnly: false,
}

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilterState {
  return {
    country: params.get('country'),
    district: params.get('district'),
    category: params.get('category'),
    search: params.get('q'),
    sort: (params.get('sort') as SortOption) || DEFAULT_DISCOVERY_FILTERS.sort,
    openNow: params.get('open') === '1',
    openBetween: (() => {
      const from = params.get('openFrom')
      const to = params.get('openTo')
      return from && to ? { start: from, end: to } : null
    })(),
    verifiedOnly: params.get('verified') === '1',
  }
}

export function serializeDiscoveryFilters(state: Partial<DiscoveryFilterState>): string {
  const params = new URLSearchParams()
  if (state.country) params.set('country', state.country)
  if (state.district) params.set('district', state.district)
  if (state.category) params.set('category', state.category)
  if (state.search) params.set('q', state.search)
  if (state.sort) params.set('sort', state.sort)
  if (state.openNow) params.set('open', '1')
  if (state.openBetween) {
    params.set('openFrom', state.openBetween.start)
    params.set('openTo', state.openBetween.end)
  }
  if (state.verifiedOnly) params.set('verified', '1')
  return params.toString()
}

// How many filters the user has actively narrowed the list with — feeds the
// "Filtros ②" badge. Search and sort don't count: search has its own visible
// input, and a sort order isn't a narrowing filter.
export function countActiveFilters(state: DiscoveryFilterState): number {
  let count = 0
  if (state.category) count += 1
  if (state.country) count += 1
  if (state.district) count += 1
  if (state.openNow) count += 1
  if (state.openBetween) count += 1
  if (state.verifiedOnly) count += 1
  return count
}
