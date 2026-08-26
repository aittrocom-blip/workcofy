'use client'

import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { MapViewProps } from '@/lib/map/types'

export function GoogleMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        mapId="workcofy-map"
        defaultCenter={center}
        defaultZoom={zoom}
        center={center}
        zoom={zoom}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            onClick={() => onMarkerSelect(marker.id)}
          >
            <div
              className="h-7 w-7 rounded-full border-2 border-white shadow-md"
              style={{ background: marker.id === selectedMarkerId ? '#000000' : '#1a1a1a' }}
            />
          </AdvancedMarker>
        ))}
      </GoogleMap>
    </APIProvider>
  )
}
