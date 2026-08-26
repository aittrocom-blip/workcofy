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
      {/*
        Only `defaultCenter`/`defaultZoom` are passed. Supplying the controlled
        `center`/`zoom` props without an `onCameraChanged` handler makes
        @vis.gl/react-google-maps snap the camera back to the prop values on every
        re-render, which blocks the user from panning or zooming. The `default*`
        props set the initial camera once and then let the user drive.
      */}
      <GoogleMap
        mapId="workcofy-map"
        defaultCenter={center}
        defaultZoom={zoom}
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
