'use client'

import type { MapViewProps } from '@/lib/map/types'
import { GoogleMapAdapter } from '@/components/map/GoogleMapAdapter'
import { MockMapAdapter } from '@/components/map/MockMapAdapter'

export function hasGoogleMapsKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

export function MapView(props: MapViewProps) {
  if (hasGoogleMapsKey()) {
    return <GoogleMapAdapter {...props} />
  }

  return (
    <div className="relative h-full w-full">
      <MockMapAdapter {...props} />
      <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
        Modo desarrollo · datos de ejemplo
      </span>
    </div>
  )
}
