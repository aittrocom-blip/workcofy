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
}

export interface MapViewHandle {
  zoomIn: () => void
  zoomOut: () => void
}
