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
import { spaceMatchesUseCase } from '@/lib/spaceUseCases'
import { haversineDistanceKm } from '@/lib/geo/haversine'

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
  const publicRestricted = fullScreen && !user
  // Falls back to Worky (avatarFor's own default) while logged out or before
  // the user has chosen one — only a genuinely chosen avatar overrides it.
  const chosenAvatarId = useUserAvatar()
  const userAvatarSrc = chosenAvatarId ? avatarFor(chosenAvatarId).src : '/icons/worky-location.png'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showParking, setShowParking] = useState(false)
  const [showPartners, setShowPartners] = useState(false)
  const [parkingMarkers, setParkingMarkers] = useState<Array<{ id: string; label: string; address: string | null; placeId: string; position: { lat: number; lng: number } }>>([])
  const [parkingLoading, setParkingLoading] = useState(false)
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null)
  const [parkingShareFeedback, setParkingShareFeedback] = useState(false)
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
      if (filters.purpose && !spaceMatchesUseCase(space, filters.purpose)) return false
      return true
    })
  }, [sorted, filters.open24h, filters.openBetween, filters.verifiedOnly, filters.purpose])

  const selectedSpace = filtered.find((space) => space.id === selectedId) ?? null
  const selectedParking = parkingMarkers.find((parking) => parking.id === selectedParkingId) ?? null

  async function shareParking() {
    if (!selectedParking) return
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination_place_id=${selectedParking.placeId}`
    const shareText = [selectedParking.label, selectedParking.address, directionsUrl].filter(Boolean).join('\n')
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: selectedParking.label, text: shareText, url: directionsUrl })
      } catch {
        // El usuario canceló el menú nativo.
      }
      return
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      setParkingShareFeedback(true)
      window.setTimeout(() => setParkingShareFeedback(false), 2200)
    }
  }

  function handleMarkerSelect(id: string) {
    if (id.startsWith('parking-')) {
      setSelectedId(null)
      setSelectedParkingId(id)
      return
    }
    setSelectedParkingId(null)
    setSelectedId(id)
  }

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
      purpose: null,
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
    .filter((space) => !showPartners || space.partner_status === 'partner')
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
      photoUrl: space.photos?.find((photo) => photo.url)?.url ?? null,
      favorited: isFavorited(space.id),
      partner: space.partner_status === 'partner',
      dimmed: filters.openNow && !isOpenNow(space.opening_hours, getLimaNow()),
      kind: showParking && space.amenities.servicios.estacionamiento === true ? 'parking' as const : 'space' as const,
    }))

  const parkingCount = spaces.filter((space) => space.amenities.servicios.estacionamiento === true).length

  useEffect(() => {
    if (!showParking) return
    const parkingLocations = filtered
      .filter((space) => space.latitude != null && space.longitude != null)
      .map((space) => `${space.latitude},${space.longitude}`)
    if (parkingLocations.length === 0) return
    let cancelled = false
    setParkingLoading(true)
    fetch(`/api/parking?locations=${encodeURIComponent(parkingLocations.join('|'))}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('parking')))
      .then((data) => { if (!cancelled) setParkingMarkers(data.parking ?? []) })
      .catch(() => { if (!cancelled) setParkingMarkers([]) })
      .finally(() => { if (!cancelled) setParkingLoading(false) })
    return () => { cancelled = true }
  }, [showParking, coordinate])

  const mapMarkers = showParking
    ? [...markers, ...parkingMarkers.map((parking) => ({
        id: parking.id, position: parking.position, label: parking.label,
        verified: false, photoUrl: null, favorited: false, dimmed: false,
        kind: 'parking' as const, address: parking.address, placeId: parking.placeId,
      }))]
    : markers

  const parkingToggle = (
    <button
      type="button"
      onClick={() => !publicRestricted && setShowParking((visible) => !visible)}
      className={`pointer-events-auto flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border text-sm font-bold shadow-sm transition ${
        publicRestricted
          ? 'border-gray-200 bg-gray-100 text-gray-400'
          : showParking
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-white bg-white/95 text-gray-800 hover:border-blue-200'
      }`}
      aria-pressed={showParking}
      title="Mostrar locales con estacionamiento registrado"
    >
      <span aria-hidden="true" className={`font-extrabold ${publicRestricted ? 'text-gray-400' : showParking ? 'text-white' : 'text-blue-600'}`}>P</span>
      <span className="sr-only">Estacionamientos</span>
    </button>
  )

  const partnerToggle = (
    <button
      type="button"
      onClick={() => { if (publicRestricted) return; setShowPartners((visible) => !visible); setSelectedId(null) }}
      className={`pointer-events-auto flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border text-sm shadow-sm transition ${
        publicRestricted
          ? 'border-gray-200 bg-gray-100'
          : showPartners
          ? 'border-workcofy-yellow bg-workcofy-yellow'
          : 'border-white bg-white/95 hover:border-workcofy-yellow'
      }`}
      aria-pressed={showPartners}
      title="Mostrar locales Partner"
    >
      <img src="/icons/logo-partner.png" alt="" className={`h-7 w-7 object-contain ${publicRestricted ? 'grayscale opacity-50' : showPartners ? 'brightness-0 invert' : ''}`} />
      <span className="sr-only">Partners</span>
    </button>
  )

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
            markers={mapMarkers}
            selectedMarkerId={selectedId}
            onMarkerSelect={handleMarkerSelect}
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
              partnerToggle={partnerToggle}
              parkingToggle={parkingToggle}
              publicRestricted={publicRestricted}
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
        {!selectedSpace && !selectedParking && (
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
                partnerToggle={partnerToggle}
                parkingToggle={parkingToggle}
                publicRestricted={publicRestricted}
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

        {showParking && (parkingLoading || (parkingCount === 0 && parkingMarkers.length === 0)) && (
          <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-xs text-gray-600 shadow-md">
            {parkingLoading ? 'Buscando estacionamientos cercanos…' : 'No encontramos estacionamientos cercanos.'}
          </div>
        )}

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

        {selectedParking && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 hidden w-full max-w-md md:block">
            <div className="pointer-events-auto h-full bg-white p-6 shadow-2xl">
              <button type="button" onClick={() => setSelectedParkingId(null)} className="mb-8 text-2xl text-gray-500" aria-label="Cerrar">×</button>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <img src="/icons/parking-map-marker-blue.png" alt="" className="h-11 w-11 object-contain" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Estacionamiento</p>
              <h2 className="mt-2 text-2xl font-extrabold text-gray-900">{selectedParking.label}</h2>
              {selectedParking.address && <p className="mt-2 text-sm text-gray-500">{selectedParking.address}</p>}
              {coordinate && <p className="mt-3 text-sm font-semibold text-gray-700">A {haversineDistanceKm(coordinate, selectedParking.position).toFixed(1)} km de ti</p>}
              <div className="mt-7 grid grid-cols-2 gap-2">
                <a href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${selectedParking.placeId}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white">Cómo llegar</a>
                <button type="button" onClick={shareParking} className="rounded-full border border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-900">{parkingShareFeedback ? 'Enlace copiado' : 'Compartir'}</button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`absolute inset-y-0 right-0 z-30 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            selectedSpace || selectedParking ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedSpace && (
            <SpaceDetailPanel
              space={selectedSpace}
              onClose={() => setSelectedId(null)}
              origin={status === 'granted' ? coordinate : null}
            />
          )}
          {selectedParking && (
            <div className="h-full overflow-y-auto p-5">
              <button type="button" onClick={() => setSelectedParkingId(null)} className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-2xl text-gray-500" aria-label="Cerrar">×</button>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <img src="/icons/parking-map-marker-blue.png" alt="" className="h-11 w-11 object-contain" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Estacionamiento</p>
              <h2 className="mt-2 text-2xl font-extrabold text-gray-900">{selectedParking.label}</h2>
              {selectedParking.address && <p className="mt-2 text-sm leading-relaxed text-gray-500">{selectedParking.address}</p>}
              {coordinate && <p className="mt-3 text-sm font-semibold text-gray-700">A {haversineDistanceKm(coordinate, selectedParking.position).toFixed(1)} km de ti</p>}
              <div className="mt-7 grid grid-cols-2 gap-2">
                <a href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${selectedParking.placeId}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white">Cómo llegar</a>
                <button type="button" onClick={shareParking} className="rounded-full border border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-900">{parkingShareFeedback ? 'Enlace copiado' : 'Compartir'}</button>
              </div>
            </div>
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
            markers={mapMarkers}
            selectedMarkerId={selectedId}
            onMarkerSelect={handleMarkerSelect}
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
        <div className="order-2 border-t border-gray-100 md:order-1 md:w-2/5 md:overflow-y-auto md:overscroll-y-none md:border-r md:border-t-0">
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
