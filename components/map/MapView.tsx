'use client'

import { forwardRef } from 'react'
import type { MapViewProps, MapViewHandle } from '@/lib/map/types'
import { GoogleMapAdapter } from '@/components/map/GoogleMapAdapter'
import { MockMapAdapter } from '@/components/map/MockMapAdapter'

export function hasGoogleMapsKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  if (hasGoogleMapsKey()) {
    return <GoogleMapAdapter ref={ref} {...props} />
  }

  return (
    <div className="relative h-full w-full">
      <MockMapAdapter ref={ref} {...props} />
      <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
        Modo desarrollo · datos de ejemplo
      </span>
    </div>
  )
})
