'use client'

import { useCallback, useState } from 'react'
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

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
      return
    }

    setState((prev) => ({ ...prev, status: 'requesting' }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'granted',
          coordinate: { lat: position.coords.latitude, lng: position.coords.longitude },
          isFallback: false,
        })
      },
      () => {
        setState({ status: 'denied', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  return { ...state, requestLocation }
}
