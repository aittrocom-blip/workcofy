'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useIsDesktop } from '@/lib/hooks/useIsDesktop'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { SpaceDetailPanel } from '@/components/discovery/SpaceDetailPanel'
import { NearbyPopularPanel } from '@/components/discovery/NearbyPopularPanel'
import { DraggableFloatingBar } from '@/components/discovery/DraggableFloatingBar'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import type { MapViewHandle } from '@/lib/map/types'
import { MapZoomControls } from '@/components/map/MapZoomControls'
import { useFavorites } from '@/components/providers/FavoritesProvider'
import { haversineDistanceKm } from '@/lib/geo/haversine'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import {
  parseDiscoveryFilters,
  serializeDiscoveryFilters,
  type DiscoveryFilterState,
  type SortOption,
} from '@/lib/filters/discoveryFilters'
import { sortSpaces } from '@/lib/filters/sortSpaces'
import { districtLabel, districtSlugFromValue } from '@/lib/districts'
import { isOpenNow } from '@/lib/hours/openingHours'
import { getLimaNow } from '@/lib/geo/limaTime'

interface DiscoveryViewProps {
  spaces: SpaceRecord[]
  autoRequestLocation?: boolean
  initialSort?: SortOption
  /**
   * Set on a dedicated district route (/miraflores, ...), where the route itself
   * determines the district. The chip bar then reflects that district and
   * navigates between district routes instead of writing a `?district=` param
   * the server page deliberately ignores.
   */
  lockedDistrict?: string
  /**
   * Immersive Google-Maps-style mode: the map fills the viewport, the
   * filter bar floats over it, and there's no side list — a marker click
   * opens the space's details in a lateral sliding panel instead.
   */
  fullScreen?: boolean
}

const LOCATION_PROMPT = 'Permite tu ubicación para encontrar espacios cerca de ti.'

export function DiscoveryView({
  spaces,
  autoRequestLocation = false,
  initialSort,
  lockedDistrict,
  fullScreen = false,
}: DiscoveryViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { coordinate, status, requestLocation } = useUserLocation()
  const { isFavorited } = useFavorites()
  const { user, loading: authLoading } = useAuthUser()
  const isDesktop = useIsDesktop()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const mapRef = useRef<MapViewHandle>(null)

  // Re-derives the exact same condition AppShell.tsx uses to decide whether
  // to show the Sidebar shell instead of Header/Footer. DiscoveryView is
  // already a client component rendered inside whichever shell AppShell
  // picked, so it can independently detect "am I currently inside the
  // Sidebar shell" rather than needing that fact threaded down from the
  // (server) /near-me page component.
  const insideSidebarShell = pathname === '/near-me' && !authLoading && user !== null && isDesktop

  const filters: DiscoveryFilterState = useMemo(() => {
    const parsed = parseDiscoveryFilters(searchParams)
    const withSort =
      !searchParams.get('sort') && initialSort ? { ...parsed, sort: initialSort } : parsed
    return lockedDistrict ? { ...withSort, district: lockedDistrict } : withSort
  }, [searchParams, initialSort, lockedDistrict])

  useEffect(() => {
    if (autoRequestLocation && status === 'idle') {
      requestLocation()
    }
  }, [autoRequestLocation, status, requestLocation])

  // Only a real, user-granted position yields a real distance. Before the user
  // grants geolocation `coordinate` is the Miraflores fallback, and measuring
  // from it would present an invented distance as fact — so distanceKm stays
  // null, matching how `userLocation` and `origin` are already gated below.
  const hasRealLocation = status === 'granted'

  // Always start at a city-wide scale (several districts visible), even once
  // a real position is known — the user explicitly asked to keep this wider
  // view as the starting point rather than auto-zooming in to ~500m; from
  // here they zoom in manually if they want to get closer.
  const mapZoom = 14

  const withDistance = useMemo(
    () =>
      spaces.map((space) => ({
        ...space,
        distanceKm:
          hasRealLocation && space.latitude != null && space.longitude != null
            ? haversineDistanceKm(coordinate, { lat: space.latitude, lng: space.longitude })
            : null,
      })),
    [spaces, coordinate, hasRealLocation]
  )

  const sorted = useMemo(() => sortSpaces(withDistance, filters.sort), [withDistance, filters.sort])

  // "Abierto ahora" and "Verified" narrow the list — they're filters, not
  // sort orders (see lib/filters/discoveryFilters.ts) — applied after sort
  // so the chosen order is preserved within the narrowed set.
  const filtered = useMemo(() => {
    const now = getLimaNow()
    return sorted.filter((space) => {
      if (filters.openNow && !isOpenNow(space.opening_hours, now)) return false
      if (filters.verifiedOnly && !space.verified) return false
      return true
    })
  }, [sorted, filters.openNow, filters.verifiedOnly])

  const selectedSpace = filtered.find((space) => space.id === selectedId) ?? null

  // Scoped to whichever country/district/category is already applied
  // server-side, so the chip list only ever offers zones that currently
  // have results — never a country's cities before that country is picked.
  const districtsByCountry = useMemo(() => {
    const map = new Map<string, Map<string, string>>()
    for (const space of spaces) {
      if (!space.country || !space.district) continue
      if (!map.has(space.country)) map.set(space.country, new Map())
      map.get(space.country)!.set(space.district, districtLabel(space.district))
    }
    const result: Record<string, { value: string; label: string }[]> = {}
    for (const [country, districts] of map) {
      result[country] = [...districts.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
    }
    return result
  }, [spaces])

  const availableDistricts = filters.country ? districtsByCountry[filters.country] ?? [] : []

  // Independent of the active search/category filters — always "what's
  // popular near you", not "what's popular within your current narrowing".
  const nearbyPopular = useMemo(() => selectNearbyPopularSpaces(withDistance), [withDistance])

  const locationUnavailable = status === 'denied' || status === 'unavailable'

  function requestNearby() {
    requestLocation()
    updateFilters({ sort: 'distance' })
  }

  function updateFilters(partial: Partial<DiscoveryFilterState>) {
    // A district only makes sense within the country it belongs to — swapping
    // countries drops whatever district was selected in the old one.
    if (partial.country !== undefined && partial.district === undefined) {
      partial = { ...partial, district: null }
    }
    // On a district route the district comes from the path, not the query.
    if (lockedDistrict && partial.district !== undefined) {
      const slug = partial.district ? districtSlugFromValue(partial.district) : null
      const query = serializeDiscoveryFilters({
        ...filters,
        ...partial,
        district: null,
      })
      router.push(slug ? `/${slug}${query ? `?${query}` : ''}` : `/${query ? `?${query}` : ''}`)
      return
    }
    const query = serializeDiscoveryFilters({ ...filters, ...partial })
    router.push(`?${query}`)
  }

  const markers = filtered
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
      photoUrl: space.photos?.find((photo) => photo.url)?.url ?? null,
      favorited: isFavorited(space.id),
    }))

  if (fullScreen) {
    return (
      <div
        className={`relative w-full overflow-hidden ${
          insideSidebarShell
            ? 'h-full'
            : 'h-[calc(100vh-4rem)] [@supports(height:100dvh)]:h-[calc(100dvh-4rem)]'
        }`}
      >
        <div className="absolute inset-0">
          <MapView
            ref={mapRef}
            center={coordinate}
            zoom={mapZoom}
            markers={markers}
            selectedMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            userLocation={status === 'granted' ? coordinate : null}
            hideNativeZoom
          />
        </div>

        {/* Desktop: draggable floating card, reachable anywhere over the map.
            Hidden in list mode — otherwise it paints under the list panel
            despite sharing its z-index, since same-z-index siblings stack
            in DOM order. */}
        {viewMode === 'map' && (
          <div className="pointer-events-none absolute inset-0 z-20 hidden p-3 md:block md:p-4">
            <DraggableFloatingBar className="pointer-events-auto w-full max-w-xl">
              <FiltersBar
                filters={filters}
                onChange={updateFilters}
                onRequestLocation={requestNearby}
                resultCount={filtered.length}
                availableDistricts={availableDistricts}
                hideLocationFilters
                floating
              />
              {locationUnavailable && (
                <p className="mt-2 rounded-xl bg-black/80 px-3 py-2 text-center text-xs text-white">
                  {LOCATION_PROMPT}
                </p>
              )}
            </DraggableFloatingBar>
          </div>
        )}

        {/* Mobile: docked to the bottom of the screen, like Uber/Cabify's bottom bar. */}
        {!selectedSpace && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto">
              <FiltersBar
                filters={filters}
                onChange={updateFilters}
                onRequestLocation={requestNearby}
                resultCount={filtered.length}
                availableDistricts={availableDistricts}
                hideLocationFilters
                hideSearch
                floating
              />
              {locationUnavailable && (
                <p className="mt-2 rounded-xl bg-black/80 px-3 py-2 text-center text-xs text-white">
                  {LOCATION_PROMPT}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Desktop-only floating controls: list/map toggle, my-location, zoom. */}
        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden flex-col items-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => setViewMode((mode) => (mode === 'map' ? 'list' : 'map'))}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-gray-50"
          >
            {viewMode === 'map' ? 'Lista' : 'Mapa'}
          </button>
          <button
            type="button"
            onClick={requestLocation}
            aria-label="Ir a mi ubicación"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
          <MapZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />
        </div>

        {/* List view — desktop only, replaces the map+pin interaction while active.
            z-30 (not z-20) so it unambiguously sits above the floating
            filters/search card and NearbyPopularPanel, both of which are
            now hidden in list mode anyway but share this z-index. */}
        {viewMode === 'list' && (
          <div className="absolute inset-y-0 left-0 z-30 hidden w-full max-w-md overflow-y-auto bg-white shadow-2xl md:block">
            <SpaceList
              spaces={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              origin={status === 'granted' ? coordinate : null}
            />
          </div>
        )}

        {/* Compact rotating "popular near you" widget, hidden once a space is
            selected, and in list mode (where it would otherwise paint over
            the list panel's bottom-left corner). */}
        {viewMode === 'map' && !selectedSpace && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden w-full max-w-xs md:block">
            <NearbyPopularPanel spaces={nearbyPopular} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}

        {/* Selected space — desktop: lightweight floating card that doesn't
            cover the map, matching the non-fullScreen branch below. Mobile
            keeps the full slide-over panel (unchanged, out of this plan's
            desktop-only scope — limited screen space still needs the
            fuller detail view there). */}
        {selectedSpace && (
          <div className="pointer-events-none absolute inset-0 z-30 hidden items-end justify-end p-4 md:flex">
            <div className="pointer-events-auto relative w-80">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Cerrar ficha"
                className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:border-black"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <SpaceCard
                space={selectedSpace}
                isSelected
                onSelect={() => {}}
                origin={status === 'granted' ? coordinate : null}
              />
            </div>
          </div>
        )}
        <div
          className={`absolute inset-y-0 right-0 z-30 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            selectedSpace ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedSpace && (
            <SpaceDetailPanel
              space={selectedSpace}
              onClose={() => setSelectedId(null)}
              origin={status === 'granted' ? coordinate : null}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8">
      <div className="mx-auto mb-4 max-w-7xl md:mb-6">
        <FiltersBar
          filters={filters}
          onChange={updateFilters}
          onRequestLocation={requestNearby}
          resultCount={filtered.length}
          availableDistricts={availableDistricts}
          hideLocationFilters
          hideSearch
          floating
        />
        {locationUnavailable && (
          <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
            {LOCATION_PROMPT}
          </p>
        )}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col overflow-hidden md:h-[70vh] md:flex-row md:rounded-3xl md:border md:border-gray-100 md:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="relative order-1 h-[45vh] md:order-2 md:h-full md:w-3/5">
          <MapView
            center={coordinate}
            zoom={mapZoom}
            markers={markers}
            selectedMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            userLocation={status === 'granted' ? coordinate : null}
          />
          {selectedSpace && (
            <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-end p-4 md:flex">
              <div className="pointer-events-auto w-80">
                <SpaceCard
                  space={selectedSpace}
                  isSelected
                  onSelect={() => {}}
                  origin={status === 'granted' ? coordinate : null}
                />
              </div>
            </div>
          )}
        </div>
        <div className="order-2 border-t border-gray-100 md:order-1 md:w-2/5 md:overflow-y-auto md:border-r md:border-t-0">
          <SpaceList
            spaces={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            origin={status === 'granted' ? coordinate : null}
          />
        </div>
      </div>
    </div>
  )
}
