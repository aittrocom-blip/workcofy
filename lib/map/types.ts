export interface MapMarkerData {
  id: string
  position: { lat: number; lng: number }
  label: string
  verified: boolean
  photoUrl: string | null
  favorited: boolean
}

export interface MapViewProps {
  center: { lat: number; lng: number }
  zoom: number
  markers: MapMarkerData[]
  selectedMarkerId: string | null
  onMarkerSelect: (id: string) => void
  userLocation?: { lat: number; lng: number } | null
  /**
   * Turns off the map provider's native zoom control UI. Native zoom stays
   * on by default everywhere — only pass this where a custom replacement
   * (e.g. MapZoomControls) is actually rendered instead.
   */
  hideNativeZoom?: boolean
  /**
   * Image shown at the user's own location marker. Defaults to the Worky
   * mascot when not provided — pass the current user's chosen avatar (see
   * lib/avatars.ts / lib/hooks/useUserAvatar.ts) to personalize it.
   */
  userAvatarSrc?: string
}

export interface MapViewHandle {
  zoomIn: () => void
  zoomOut: () => void
}
