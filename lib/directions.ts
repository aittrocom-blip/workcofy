interface DirectionsTarget {
  google_place_id: string | null
  latitude: number | null
  longitude: number | null
}

export function buildDirectionsUrl(
  space: DirectionsTarget,
  origin?: { lat: number; lng: number } | null
): string {
  const destination = space.google_place_id
    ? `destination_place_id=${space.google_place_id}`
    : `destination=${space.latitude},${space.longitude}`

  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : ''

  return `https://www.google.com/maps/dir/?api=1&${destination}${originParam}`
}
