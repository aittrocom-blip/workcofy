'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import type { MapViewProps } from '@/lib/map/types'

// Centers and zooms the camera on the user's position exactly once, the
// first time a real (non-fallback) location becomes available — after
// that the user is free to pan/zoom without the map fighting them. Must
// live inside <GoogleMap> since useMap() needs that context.
function CenterOnUserLocation({
  userLocation,
  zoom,
}: {
  userLocation: { lat: number; lng: number } | null
  zoom: number
}) {
  const map = useMap()
  const hasCenteredRef = useRef(false)

  useEffect(() => {
    if (!map || !userLocation || hasCenteredRef.current) return
    map.panTo(userLocation)
    map.setZoom(zoom)
    hasCenteredRef.current = true
  }, [map, userLocation, zoom])

  return null
}

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
          <>
            <CenterOnUserLocation userLocation={userLocation} zoom={zoom} />
            {/* zIndex kept high so Worky never ends up buried under a venue
                pin — venue markers above have no explicit zIndex. */}
            <AdvancedMarker position={userLocation} zIndex={999}>
              {/* Worky, the Workcofy mascot, marks the user's own position —
                  a plain blue dot blended in with the white-backed venue
                  pins. The ping halo behind it is the same brand yellow as
                  Verified pins, radiating outward to draw the eye. */}
              <span className="relative flex h-9 w-9 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-workcofy-yellow opacity-60" />
                <img
                  src="/icons/worky-location.png"
                  alt="Tu ubicación"
                  className="relative h-9 w-9 drop-shadow-md"
                />
              </span>
            </AdvancedMarker>
          </>
        )}
      </GoogleMap>
    </APIProvider>
  )
}
