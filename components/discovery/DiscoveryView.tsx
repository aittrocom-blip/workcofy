'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { useIsDesktop } from '@/lib/hooks/useIsDesktop'
import { useUserAvatar } from '@/lib/hooks/useUserAvatar'
import { avatarFor } from '@/lib/avatars'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { CompactSpaceRow } from '@/components/discovery/CompactSpaceRow'
import { SpaceDetailPanel } from '@/components/discovery/SpaceDetailPanel'
import { NearbyPopularPanel } from '@/components/discovery/NearbyPopularPanel'
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
import { isOpenNow, isOpenDuring } from '@/lib/hours/openingHours'
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
  // Falls back to Worky (avatarFor's own default) while logged out or before
  // the user has chosen one — only a genuinely chosen avatar overrides it.
  const chosenAvatarId = useUserAvatar()
  const userAvatarSrc = chosenAvatarId ? avatarFor(chosenAvatarId).src : '/icons/worky-location.png'
  const isDesktop = useIsDesktop()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Desktop map view starts a selection as the small preview card; "Ver
  // espacio" upgrades it to the full ficha in place instead of navigating to
  // /spaces/[slug], which would leave the sidebar shell. Resets whenever the
  // selection itself changes, so a new marker click always starts compact.
  const [detailOpen, setDetailOpen] = useState(false)
  useEffect(() => {
    setDetailOpen(false)
  }, [selectedId])
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
      if (
        filters.openBetween &&
        !isOpenDuring(space.opening_hours, now, filters.openBetween.start, filters.openBetween.end)
      ) {
        return false
      }
      if (filters.verifiedOnly && !space.verified) return false
      return true
    })
  }, [sorted, filters.openNow, filters.openBetween, filters.verifiedOnly])

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

  // Opened from the sidebar's AvatarMenu via a query param instead of
  // navigating to the standalone /favoritos page, so it opens as an overlay
  // over the map (like a space ficha) instead of leaving the sidebar shell.
  // Read off `withDistance` (not `filtered`) so an active category/search
  // filter never hides a favorite that doesn't match it.
  const favoritesOpen = searchParams.get('favorites') === '1'
  const favoriteSpaces = useMemo(
    () => withDistance.filter((space) => isFavorited(space.id)),
    [withDistance, isFavorited]
  )
  // Avoids the favorites panel and a selected space's ficha docking to the
  // same right-hand edge at once.
  useEffect(() => {
    if (favoritesOpen) setSelectedId(null)
  }, [favoritesOpen])

  function closeFavorites() {
    const query = serializeDiscoveryFilters(filters)
    router.push(query ? `?${query}` : pathname)
  }

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
                hideFiltersPanel
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

        {/* Desktop-only floating control: zoom. */}
        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden flex-col items-end gap-2 md:flex">
          <MapZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />
        </div>

        {/* Favoritos — opened from the sidebar's AvatarMenu via ?favorites=1
            instead of navigating to /favoritos, so it overlays the map the
            same way a space ficha does, keeping the sidebar visible. */}
        {favoritesOpen && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 hidden w-full max-w-md md:block">
            <div className="pointer-events-auto flex h-full flex-col bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
                <div>
                  <p className="text-sm font-semibold">Mis favoritos</p>
                  <p className="text-xs text-gray-500">{favoriteSpaces.length} espacios guardados</p>
                </div>
                <button
                  type="button"
                  onClick={closeFavorites}
                  aria-label="Cerrar favoritos"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-black hover:text-black"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {favoriteSpaces.length === 0 ? (
                  <p className="mt-8 px-2 text-center text-sm text-gray-500">
                    Todavía no guardaste ningún espacio — toca el corazón en cualquier ficha para agregarlo acá.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {favoriteSpaces.map((space) => (
                      <CompactSpaceRow
                        key={space.id}
                        space={space}
                        isSelected={space.id === selectedId}
                        onSelect={() => {
                          closeFavorites()
                          setSelectedId(space.id)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact rotating "popular near you" widget, hidden once a space is selected. */}
        {!selectedSpace && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden w-full max-w-xs md:block">
            <NearbyPopularPanel spaces={nearbyPopular} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}

        {/* Selected space — desktop: starts as a lightweight floating card
            that doesn't cover the map; "Ver espacio" upgrades it to the full
            ficha docked to the right edge, still inside the map window so
            the sidebar stays visible (no navigation to /spaces/[slug]). */}
        {selectedSpace && !detailOpen && (
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
                onViewDetail={() => setDetailOpen(true)}
              />
            </div>
          </div>
        )}

        {selectedSpace && detailOpen && (
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
