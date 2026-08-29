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
              <div className="relative">
                {/* A circular photo of the space is the pin itself when one
                    exists. The border color keeps its one existing meaning —
                    yellow for Workcofy Verified, white otherwise — favorited
                    status gets its own heart badge instead of touching color. */}
                <div
                  className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] shadow transition-transform duration-150 ${
                    isSelected ? 'scale-[1.18] shadow-lg' : ''
                  } ${marker.verified ? 'border-workcofy-yellow' : 'border-white'}`}
                >
                  {marker.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={marker.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center ${
                        marker.verified ? 'bg-workcofy-yellow' : 'bg-white'
                      }`}
                    >
                      <img src="/logo-solo-alpha.png" alt="Workcofy" className="h-4 w-auto" />
                    </div>
                  )}
                </div>
                {marker.favorited && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-red-500" fill="currentColor">
                      <path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z" />
                    </svg>
                  </span>
                )}
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
