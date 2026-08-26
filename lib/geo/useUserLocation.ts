'use client'

import { useCallback, useRef, useState } from 'react'
import { DISTRICT_CENTROIDS } from '@/lib/districts'
import type { LatLng } from '@/lib/geo/haversine'

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

export interface UserLocationState {
  status: LocationStatus
  coordinate: LatLng
  isFallback: boolean
}

const MIRAFLORES_FALLBACK: LatLng = DISTRICT_CENTROIDS.miraflores

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    status: 'idle',
    coordinate: MIRAFLORES_FALLBACK,
    isFallback: true,
  })

  const requestIdRef = useRef(0)

  const requestLocation = useCallback(() => {
    // Increment request id to invalidate any pending callbacks from prior calls
    requestIdRef.current += 1
    const thisRequestId = requestIdRef.current

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
      return
    }

    setState((prev) => ({ ...prev, status: 'requesting' }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Only update state if this is still the most recent request
        if (requestIdRef.current === thisRequestId) {
          setState({
            status: 'granted',
            coordinate: { lat: position.coords.latitude, lng: position.coords.longitude },
            isFallback: false,
          })
        }
      },
      () => {
        // Only update state if this is still the most recent request
        if (requestIdRef.current === thisRequestId) {
          setState({ status: 'denied', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  return { ...state, requestLocation }
}
