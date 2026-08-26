const EARTH_RADIUS_KM = 6371

export interface LatLng {
  lat: number
  lng: number
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)))
  return EARTH_RADIUS_KM * c
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`
}
