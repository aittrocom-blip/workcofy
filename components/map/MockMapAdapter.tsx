'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapViewProps } from '@/lib/map/types'

const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MockMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map())

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
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50% 50% 50% 0'
      el.style.background = markerData.id === selectedMarkerId ? '#000000' : '#1a1a1a'
      el.style.border = '2px solid white'
      el.style.transform = 'rotate(-45deg)'
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => onMarkerSelect(markerData.id))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map)

      markerRefs.current.set(markerData.id, marker)
    })
  }, [markers, selectedMarkerId, onMarkerSelect])

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom })
  }, [center.lat, center.lng, zoom])

  return <div ref={containerRef} className="h-full w-full" data-testid="mock-map-adapter" />
}
