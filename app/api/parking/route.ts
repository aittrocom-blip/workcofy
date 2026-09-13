import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'))
  const lng = Number(request.nextUrl.searchParams.get('lng'))
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  if (!apiKey) return NextResponse.json({ error: 'Google Maps no configurado' }, { status: 500 })
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '1800')
  url.searchParams.set('keyword', 'estacionamiento parking')
  url.searchParams.set('key', apiKey)
  const response = await fetch(url, { next: { revalidate: 3600 } })
  if (!response.ok) return NextResponse.json({ error: 'No se pudo consultar Google Maps' }, { status: 502 })
  const data = await response.json()
  const parking = (data.results ?? []).slice(0, 20).map((place: any) => ({
    id: `parking-${place.place_id}`, label: place.name, address: place.vicinity ?? null,
    placeId: place.place_id, position: place.geometry?.location,
  })).filter((place: any) => place.position?.lat != null && place.position?.lng != null)
  return NextResponse.json({ parking })
}
