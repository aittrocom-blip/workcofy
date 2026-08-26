import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow, formatPeriodForDay } from '@/lib/hours/openingHours'
import { districtLabel } from '@/lib/districts'
import { buildDirectionsUrl } from '@/lib/directions'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceCardProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
  origin?: { lat: number; lng: number } | null
}

export function SpaceCard({ space, isSelected, onSelect, origin = null }: SpaceCardProps) {
  const now = new Date()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayHours = formatPeriodForDay(space.opening_hours, now.getDay())

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border p-3 shadow-sm transition ${
        isSelected ? 'border-black' : 'border-gray-200'
      }`}
    >
      <div className="h-32 w-full rounded-xl bg-gray-100" />
      <h3 className="mt-2 font-semibold">{space.name}</h3>
      <p className="text-sm text-gray-500">{districtLabel(space.district)}</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {space.rating != null && <span>★ {space.rating.toFixed(1)}</span>}
        {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
      </div>
      <p className="mt-1 text-xs text-gray-500">{openNow ? `Abierto · ${todayHours}` : 'Cerrado'}</p>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/spaces/${space.slug}`}
          className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          Ver espacio
        </Link>
        <a
          href={buildDirectionsUrl(space, origin)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )
}
