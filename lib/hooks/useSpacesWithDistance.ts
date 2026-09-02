'use client'

import { useMemo } from 'react'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { haversineDistanceKm } from '@/lib/geo/haversine'
import type { SpaceRecord, SpaceWithDistance } from '@/lib/data/spaceTypes'

// Only a real, user-granted position yields a real distance. Before the user
// grants geolocation the location hook reports a city-center fallback, and
// measuring from it would present an invented distance as fact — so
// distanceKm stays null until status is 'granted'.
export function useSpacesWithDistance(spaces: SpaceRecord[]): SpaceWithDistance[] {
  const { coordinate, status } = useUserLocation()
  const hasRealLocation = status === 'granted'

  return useMemo(
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
}
