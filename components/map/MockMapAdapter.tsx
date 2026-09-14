'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapViewProps, MapViewHandle } from '@/lib/map/types'

const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// The official Workcofy isotype (pin + cup + wifi) doubles as the map pin
// itself — used as-is, undistorted, instead of a synthetic marker shape.
const MARK_SRC = '/logo-solo-alpha.png'
const MARK_HEIGHT = 34

// Worky (default) or the logged-in user's chosen avatar marks their own
// position — matching what GoogleMapAdapter renders so both map backends
// look consistent. The yellow ping halo behind it is the same brand yellow
// as Verified pins, radiating outward to draw the eye. z-index is kept high
// so this marker never ends up buried under a venue pin.
function createUserLocationElement(avatarSrc: string): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.width = '36px'
  wrapper.style.height = '36px'
  wrapper.style.zIndex = '999'

  const halo = document.createElement('div')
  halo.style.position = 'absolute'
  halo.style.inset = '0'
  halo.style.borderRadius = '9999px'
  halo.style.backgroundColor = '#F4B942'
  halo.style.opacity = '0.6'
  halo.style.animation = 'workcofy-marker-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite'
  wrapper.appendChild(halo)

  const img = document.createElement('img')
  img.src = avatarSrc
  img.alt = 'Tu ubicación'
  img.style.position = 'relative'
  img.style.height = '36px'
  img.style.width = '36px'
  img.style.display = 'block'
  img.style.borderRadius = '9999px'
  img.style.objectFit = 'cover'
  img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))'
  wrapper.appendChild(img)

  return wrapper
}

function createMarkerElement(
  isSelected: boolean,
  kind: 'space' | 'parking' | undefined,
  label: string,
  verified: boolean,
  partner: boolean | undefined,
  photoUrl: string | null,
  favorited: boolean,
  dimmed: boolean,
  onSelect: () => void
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.cursor = 'pointer'
  wrapper.style.opacity = dimmed ? '0.45' : '1'

  if (kind === 'parking') {
    const img = document.createElement('img')
    img.src = '/icons/parking-map-marker-blue.png'
    img.alt = `Estacionamiento cerca de ${label}`
    img.style.width = '44px'
    img.style.height = '44px'
    img.style.objectFit = 'contain'
    img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
    img.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)'
    wrapper.appendChild(img)
    wrapper.addEventListener('click', onSelect)
    return wrapper
  }

  const el = document.createElement('div')
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.width = '36px'
  el.style.height = '36px'
  el.style.borderRadius = '9999px'
  el.style.overflow = 'hidden'
  // Border color keeps its one existing meaning — yellow for Workcofy
  // Verified, white otherwise. Favorited gets its own heart badge below,
  // never a color change.
  el.style.border = `3px solid ${partner || verified ? '#F4B942' : '#ffffff'}`
  el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease'
  el.style.transform = isSelected ? 'scale(1.18)' : 'scale(1)'
  el.style.boxShadow = isSelected
    ? '0 6px 10px rgba(0,0,0,0.35)'
    : partner
      ? '0 0 0 4px rgba(244,185,66,0.16), 0 0 14px rgba(244,185,66,0.55)'
      : '0 2px 4px rgba(0,0,0,0.25)'
  if (partner) el.classList.add('partner-signal')

  if (photoUrl) {
    const img = document.createElement('img')
    img.src = photoUrl
    img.alt = ''
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'
    el.appendChild(img)
  } else {
    el.style.backgroundColor = partner || verified ? '#F4B942' : '#ffffff'
    const img = document.createElement('img')
    img.src = MARK_SRC
    img.alt = 'Workcofy'
    img.style.height = `${MARK_HEIGHT - 8}px`
    img.style.width = 'auto'
    el.appendChild(img)
  }

  wrapper.appendChild(el)

  if (favorited) {
    const heart = document.createElement('span')
    heart.style.position = 'absolute'
    heart.style.bottom = '-3px'
    heart.style.right = '-3px'
    heart.style.display = 'flex'
    heart.style.alignItems = 'center'
    heart.style.justifyContent = 'center'
    heart.style.width = '10px'
    heart.style.height = '10px'
    heart.style.borderRadius = '9999px'
    heart.style.backgroundColor = '#F4B942'
    heart.style.border = '2px solid #ffffff'
    heart.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
    // Same heart path as FavoriteButton.tsx's HeartIcon and
    // GoogleMapAdapter's marker, so it reads as the same icon everywhere.
    wrapper.appendChild(heart)
  }

  wrapper.addEventListener('click', onSelect)
  return wrapper
}

export const MockMapAdapter = forwardRef<MapViewHandle, MapViewProps>(function MockMapAdapter(
  { center, zoom, markers, selectedMarkerId, onMarkerSelect, userLocation, userAvatarSrc },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map())
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      centerOn: (position, nextZoom) =>
        mapRef.current?.easeTo({ center: [position.lng, position.lat], ...(nextZoom != null ? { zoom: nextZoom } : {}) }),
    }),
    []
  )

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
      const el = createMarkerElement(
        isSelected,
        markerData.kind,
        markerData.label,
        markerData.verified,
        markerData.partner,
        markerData.photoUrl,
        markerData.favorited,
        markerData.dimmed,
        () => onMarkerSelect(markerData.id)
      )

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
      const marker = new maplibregl.Marker({
        element: createUserLocationElement(userAvatarSrc ?? '/icons/worky-location.png'),
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map)
      // z-index on our own element only wins against its own children — to
      // out-rank *other* markers (whose venue pins get recreated on every
      // filter change, and would otherwise re-append on top in DOM order),
      // it has to go on maplibre's own wrapper, one level up.
      const wrapperEl = marker.getElement().parentElement
      if (wrapperEl) wrapperEl.style.zIndex = '999'
      userLocationMarkerRef.current = marker
    }
  }, [userLocation, userAvatarSrc])

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom })
  }, [center.lat, center.lng, zoom])

  return <div ref={containerRef} className="h-full w-full" data-testid="mock-map-adapter" />
})
