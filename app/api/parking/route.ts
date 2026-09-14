import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const locations = (request.nextUrl.searchParams.get('locations') ?? '')
    .split('|')
    .map((value) => {
      const [lat, lng] = value.split(',').map(Number)
      return { lat, lng }
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (locations.length === 0) return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  if (!apiKey) return NextResponse.json({ error: 'Google Maps no configurado' }, { status: 500 })
  const results = await Promise.all(locations.slice(0, 100).map(async ({ lat, lng }) => {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', '700')
    url.searchParams.set('keyword', 'estacionamiento parking')
    url.searchParams.set('key', apiKey)
    const response = await fetch(url, { next: { revalidate: 3600 } })
    if (!response.ok) return []
    const data = await response.json()
    return data.results ?? []
  }))
  const unique = new Map<string, any>()
  results.flat().forEach((place) => unique.set(place.place_id, place))
  const parking = [...unique.values()].map((place: any) => ({
    id: `parking-${place.place_id}`, label: place.name, address: place.vicinity ?? null,
    placeId: place.place_id, position: place.geometry?.location,
  })).filter((place: any) => place.position?.lat != null && place.position?.lng != null)

  try {
    const admin = createAdminSupabaseClient()
    await admin.from('parking_locations').upsert(
      parking.map((place: any) => ({
        google_place_id: place.placeId, name: place.label, address: place.address,
        latitude: place.position.lat, longitude: place.position.lng, last_synced_at: new Date().toISOString(),
      })),
      { onConflict: 'google_place_id' }
    )
  } catch (error) {
    console.warn('No se pudo guardar el catálogo de estacionamientos:', error)
  }
  return NextResponse.json({ parking })
}
