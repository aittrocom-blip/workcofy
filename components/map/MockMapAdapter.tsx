'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapViewProps } from '@/lib/map/types'

const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// The official Workcofy isotype (pin + cup + wifi) doubles as the map pin
// itself — used as-is, undistorted, instead of a synthetic marker shape.
const MARK_SRC = '/logo-solo-alpha.png'
const MARK_HEIGHT = 34

// Worky, the Workcofy mascot, marks the user's own position — matching
// what GoogleMapAdapter renders so both map backends look consistent. A
// plain blue dot blended in with the white-backed venue pins.
function createUserLocationElement(): HTMLElement {
  const img = document.createElement('img')
  img.src = '/icons/worky-location.png'
  img.alt = 'Tu ubicación'
  img.style.height = '36px'
  img.style.width = '36px'
  img.style.display = 'block'
  img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))'
  return img
}

function createMarkerElement(isSelected: boolean, verified: boolean, onSelect: () => void): HTMLElement {
  const el = document.createElement('div')
  el.style.cursor = 'pointer'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.borderRadius = '9999px'
  el.style.padding = '4px'
  // Yellow disc for Workcofy Verified spaces, white for everything else
  // discovered by the community — same distinction as GoogleMapAdapter.
  el.style.backgroundColor = verified ? '#F4B942' : '#ffffff'
  el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease'
  el.style.transform = isSelected ? 'scale(1.18)' : 'scale(1)'
  el.style.boxShadow = isSelected
    ? '0 6px 10px rgba(0,0,0,0.35)'
    : '0 2px 4px rgba(0,0,0,0.25)'

  const img = document.createElement('img')
  img.src = MARK_SRC
  img.alt = 'Workcofy'
  img.style.height = `${MARK_HEIGHT - 8}px`
  img.style.width = 'auto'
  img.style.display = 'block'
  el.appendChild(img)

  el.addEventListener('click', onSelect)
  return el
}

export function MockMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
  userLocation,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map())
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [center.lng, center.lat],
      zoom,
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current.clear()

    markers.forEach((markerData) => {
      const isSelected = markerData.id === selectedMarkerId
      const el = createMarkerElement(isSelected, markerData.verified, () => onMarkerSelect(markerData.id))

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map)

      markerRefs.current.set(markerData.id, marker)
    })
  }, [markers, selectedMarkerId, onMarkerSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!userLocation) {
      userLocationMarkerRef.current?.remove()
      userLocationMarkerRef.current = null
      return
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
    } else {
      userLocationMarkerRef.current = new maplibregl.Marker({ element: createUserLocationElement() })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map)
    }
  }, [userLocation])

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom })
  }, [center.lat, center.lng, zoom])

  return <div ref={containerRef} className="h-full w-full" data-testid="mock-map-adapter" />
}
