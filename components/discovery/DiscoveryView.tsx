'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { haversineDistanceKm } from '@/lib/geo/haversine'
import {
  parseDiscoveryFilters,
  serializeDiscoveryFilters,
  type DiscoveryFilterState,
  type SortOption,
} from '@/lib/filters/discoveryFilters'
import { sortSpaces } from '@/lib/filters/sortSpaces'

interface DiscoveryViewProps {
  spaces: SpaceRecord[]
  autoRequestLocation?: boolean
  initialSort?: SortOption
}

export function DiscoveryView({ spaces, autoRequestLocation = false, initialSort }: DiscoveryViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { coordinate, status, requestLocation } = useUserLocation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters: DiscoveryFilterState = useMemo(() => {
    const parsed = parseDiscoveryFilters(searchParams)
    if (!searchParams.get('sort') && initialSort) {
      return { ...parsed, sort: initialSort }
    }
    return parsed
  }, [searchParams, initialSort])

  useEffect(() => {
    if (autoRequestLocation && status === 'idle') {
      requestLocation()
    }
  }, [autoRequestLocation, status, requestLocation])

  const withDistance = useMemo(
    () =>
      spaces.map((space) => ({
        ...space,
        distanceKm:
          space.latitude != null && space.longitude != null
            ? haversineDistanceKm(coordinate, { lat: space.latitude, lng: space.longitude })
            : null,
      })),
    [spaces, coordinate]
  )

  const sorted = useMemo(() => sortSpaces(withDistance, filters.sort), [withDistance, filters.sort])

  function updateFilters(partial: Partial<DiscoveryFilterState>) {
    const query = serializeDiscoveryFilters({ ...filters, ...partial })
    router.push(`?${query}`)
  }

  const markers = sorted
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
    }))

  return (
    <div className="flex flex-col md:h-[70vh] md:flex-row">
      <div className="order-1 h-[45vh] md:order-2 md:h-full md:w-3/5">
        <MapView
          center={coordinate}
          zoom={14}
          markers={markers}
          selectedMarkerId={selectedId}
          onMarkerSelect={setSelectedId}
          userLocation={status === 'granted' ? coordinate : null}
        />
      </div>
      <div className="order-2 md:order-1 md:w-2/5 md:overflow-y-auto">
        <FiltersBar filters={filters} onChange={updateFilters} onRequestLocation={requestLocation} />
        <SpaceList
          spaces={sorted}
          selectedId={selectedId}
          onSelect={setSelectedId}
          origin={status === 'granted' ? coordinate : null}
        />
      </div>
    </div>
  )
}
