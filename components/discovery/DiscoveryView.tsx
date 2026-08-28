'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { SpaceDetailPanel } from '@/components/discovery/SpaceDetailPanel'
import { NearbyPopularPanel } from '@/components/discovery/NearbyPopularPanel'
import { DraggableFloatingBar } from '@/components/discovery/DraggableFloatingBar'
import { useUserLocation } from '@/lib/geo/useUserLocation'
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
  const { coordinate, status, requestLocation } = useUserLocation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
    }))

  if (fullScreen) {
    return (
      <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden [@supports(height:100dvh)]:h-[calc(100dvh-4rem)]">
        <div className="absolute inset-0">
          <MapView
            center={coordinate}
            zoom={14}
            markers={markers}
            selectedMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            userLocation={status === 'granted' ? coordinate : null}
          />
        </div>

        {/* Desktop: draggable floating card, reachable anywhere over the map. */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden p-3 md:block md:p-4">
          <DraggableFloatingBar className="pointer-events-auto w-full max-w-xl">
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
          </DraggableFloatingBar>
        </div>

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

        {/* Compact rotating "popular near you" widget, hidden once a space is selected. */}
        {!selectedSpace && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden w-full max-w-xs md:block">
            <NearbyPopularPanel spaces={nearbyPopular} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}

        {/* Selected space's details — slides in from the right, full height. */}
        <div
          className={`absolute inset-y-0 right-0 z-30 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out ${
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
            zoom={14}
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
