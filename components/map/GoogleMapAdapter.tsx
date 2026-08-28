'use client'

import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { MapViewProps } from '@/lib/map/types'

export function GoogleMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
  userLocation,
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
        {markers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId
          return (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              onClick={() => onMarkerSelect(marker.id)}
            >
              {/* The official Workcofy isotype doubles as the map pin itself,
                  backed by a colored disc: yellow for Workcofy Verified spaces,
                  white for everything else discovered by the community. */}
              <div
                className={`flex items-center justify-center rounded-full p-1 shadow transition-transform duration-150 ${
                  isSelected ? 'scale-[1.18] shadow-lg' : ''
                } ${marker.verified ? 'bg-workcofy-yellow' : 'bg-white'}`}
              >
                <img src="/logo-solo-alpha.png" alt="Workcofy" className="h-[26px] w-auto" />
              </div>
            </AdvancedMarker>
          )
        })}

        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={0}>
            {/* Worky, the Workcofy mascot, marks the user's own position — a
                plain blue dot blended in with the white-backed venue pins. */}
            <img src="/icons/worky-location.png" alt="Tu ubicación" className="h-9 w-9 drop-shadow-md" />
          </AdvancedMarker>
        )}
      </GoogleMap>
    </APIProvider>
  )
}
