export type SortOption = 'distance' | 'rating' | 'workcofy_score' | 'popular' | 'open_now'

export interface DiscoveryFilterState {
  country: string | null
  district: string | null
  category: string | null
  search: string | null
  sort: SortOption
  // "Abierto ahora" doesn't narrow the list — closed spaces stay visible,
  // just dimmed (see DiscoveryView) — while "verificado" is a genuine
  // narrowing filter, a trust signal rather than a ranking criterion.
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
  // On by default — knowing what's open right now is the whole point of
  // looking at the map, so it starts highlighted rather than requiring an
  // extra tap.
  openNow: true,
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
    // Defaults on when the param is absent (fresh visit); an explicit
    // open=0 (written whenever the user turns it off) is the only way to
    // start unhighlighted.
    openNow: params.has('open') ? params.get('open') === '1' : DEFAULT_DISCOVERY_FILTERS.openNow,
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
  // Written explicitly (1 or 0), never omitted, since "no param" now means
  // "on" (see parseDiscoveryFilters) rather than "off".
  if (state.openNow !== undefined) params.set('open', state.openNow ? '1' : '0')
  if (state.openBetween) {
    params.set('openFrom', state.openBetween.start)
    params.set('openTo', state.openBetween.end)
  }
  if (state.verifiedOnly) params.set('verified', '1')
  return params.toString()
}

// How many filters the user has actively narrowed the list with — feeds the
// "Filtros ②" badge. Search and sort don't count: search has its own visible
// input, and a sort order isn't a narrowing filter. openNow doesn't count
// either — it no longer removes anything from the list, just dims closed
// spaces (see DiscoveryView), so it's not a narrowing filter.
export function countActiveFilters(state: DiscoveryFilterState): number {
  let count = 0
  if (state.category) count += 1
  if (state.country) count += 1
  if (state.district) count += 1
  if (state.openBetween) count += 1
  if (state.verifiedOnly) count += 1
  return count
}
