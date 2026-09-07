'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { avatarFor } from '@/lib/avatars'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { SpaceDetailPanel } from '@/components/discovery/SpaceDetailPanel'
import { NearbyPopularStrip } from '@/components/discovery/NearbyPopularStrip'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import type { MapViewHandle } from '@/lib/map/types'
import { MapZoomControls } from '@/components/map/MapZoomControls'
import { useFavorites } from '@/components/providers/FavoritesProvider'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import {
  parseDiscoveryFilters,
  serializeDiscoveryFilters,
  type DiscoveryFilterState,
  type SortOption,
} from '@/lib/filters/discoveryFilters'
import { sortSpaces } from '@/lib/filters/sortSpaces'
import { districtLabel, districtSlugFromValue } from '@/lib/districts'
import { isOpenNow, isOpenDuring, isOpen24HoursToday } from '@/lib/hours/openingHours'
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
  const { user } = useAuthUser()
  // Falls back to Worky (avatarFor's own default) while logged out or before
  // the user has chosen one — only a genuinely chosen avatar overrides it.
  const chosenAvatarId = useUserAvatar()
  const userAvatarSrc = chosenAvatarId ? avatarFor(chosenAvatarId).src : '/icons/worky-location.png'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mapRef = useRef<MapViewHandle>(null)

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

  // Always start at a city-wide scale (several districts visible), even once
  // a real position is known — the user explicitly asked to keep this wider
  // view as the starting point rather than auto-zooming in to ~500m; from
  // here they zoom in manually if they want to get closer.
  const mapZoom = 14

  const withDistance = useSpacesWithDistance(spaces, coordinate, status)

  const sorted = useMemo(() => sortSpaces(withDistance, filters.sort), [withDistance, filters.sort])

  // "Verified" narrows the list — it's a filter, not a sort order (see
  // lib/filters/discoveryFilters.ts) — applied after sort so the chosen
  // order is preserved within the narrowed set. "Abierto ahora" doesn't
  // narrow anything: closed spaces stay in the list, just dimmed (see
  // `markers` below and the `dimClosed` prop passed to SpaceList/SpaceCard),
  // so someone can still see and tap a closed place.
  const filtered = useMemo(() => {
    const now = getLimaNow()
    return sorted.filter((space) => {
      if (filters.open24h && !isOpen24HoursToday(space.opening_hours, now)) return false
      if (
        filters.openBetween &&
        !isOpenDuring(space.opening_hours, now, filters.openBetween.start, filters.openBetween.end)
      ) {
        return false
      }
      if (filters.verifiedOnly && !space.verified) return false
      return true
    })
  }, [sorted, filters.open24h, filters.openBetween, filters.verifiedOnly])

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
  // Prioritizes what's open right now (see selectNearbyPopularSpaces).
  const nearbyPopular = useMemo(
    () => selectNearbyPopularSpaces(withDistance, getLimaNow()),
    [withDistance]
  )

  const locationUnavailable = status === 'denied' || status === 'unavailable'

  function requestNearby() {
    requestLocation()
    updateFilters({ sort: 'distance' })
  }

  function clearDiscoveryFilters() {
    updateFilters({
      ...(lockedDistrict ? {} : { country: null, district: null }),
      category: [],
      search: null,
      open24h: false,
      openBetween: null,
      verifiedOnly: false,
    })
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
      dimmed: filters.openNow && !isOpenNow(space.opening_hours, getLimaNow()),
    }))

  if (fullScreen) {
    // --app-bottom-nav-height is only set inside the authenticated shell
    // (fixed tab bar); on the public site it falls back to 0.
    return (
      <div className="relative h-[calc(100vh-var(--app-header-height,4rem)-var(--app-bottom-nav-height,0px))] w-full overflow-hidden [@supports(height:100dvh)]:h-[calc(100dvh-var(--app-header-height,4rem)-var(--app-bottom-nav-height,0px))]">
        <div className="absolute inset-0">
          <MapView
            ref={mapRef}
            center={coordinate}
            zoom={mapZoom}
            markers={markers}
            selectedMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            userLocation={status === 'granted' ? coordinate : null}
            userAvatarSrc={userAvatarSrc}
            hideNativeZoom
          />
        </div>

        {/* Desktop: floating card, docked top-left over the map. */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden p-3 md:block md:p-4">
          <div className="pointer-events-auto w-full max-w-2xl">
            <FiltersBar
              filters={filters}
              onChange={updateFilters}
              onRequestLocation={requestNearby}
              resultCount={filtered.length}
              availableDistricts={availableDistricts}
              hideLocationFilters
              hideSearch
              hideFiltersPanel
              floating
              mapOverlay
            />
            {locationUnavailable && (
              <p className="mt-2 rounded-xl bg-black/80 px-3 py-2 text-center text-xs text-white">
                {LOCATION_PROMPT}
              </p>
            )}
          </div>
        </div>

        {/* Mobile uses the same compact controls as desktop, but docked at the
            top. This preserves the lower half of the map for pins and keeps
            the toolbar out of the way of the space detail sheet. */}
        {!selectedSpace && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
            <div className="pointer-events-auto">
              <FiltersBar
                filters={filters}
                onChange={updateFilters}
                onRequestLocation={requestNearby}
                resultCount={filtered.length}
                availableDistricts={availableDistricts}
                hideLocationFilters
                hideSearch
                hideFiltersPanel
                floating
                mapOverlay
              />
              {locationUnavailable && (
                <p className="mt-2 rounded-xl bg-black/80 px-3 py-2 text-center text-xs text-white">
                  {LOCATION_PROMPT}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Desktop-only floating control: zoom. */}
        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden flex-col items-end gap-2 md:flex">
          <MapZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />
        </div>

        {/* Bottom horizontal carousel of nearby spaces, hidden once a space
            is selected — same rule Google Maps follows: the side panel takes
            over instead of overlapping the bottom strip. */}
        {!selectedSpace && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 hidden md:block">
            <div className="pointer-events-auto">
              <NearbyPopularStrip spaces={nearbyPopular} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </div>
        )}

        {/* Selected space — desktop: the full ficha docks to the right edge
            immediately on click (no small-preview step first), same as the
            mobile sheet below and matching Google Maps' own side panel. */}
        {selectedSpace && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 hidden w-full max-w-md md:block">
            <div className="pointer-events-auto h-full bg-white shadow-2xl">
              <SpaceDetailPanel
                space={selectedSpace}
                onClose={() => setSelectedId(null)}
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
            userAvatarSrc={userAvatarSrc}
          />
          {selectedSpace && (
            <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-end p-4 md:flex">
              <div className="pointer-events-auto w-80">
                {/* Not dimmed for the same reason as the full-screen preview above. */}
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
            onClearFilters={clearDiscoveryFilters}
            origin={status === 'granted' ? coordinate : null}
            dimClosed={filters.openNow}
          />
        </div>
      </div>
    </div>
  )
}
