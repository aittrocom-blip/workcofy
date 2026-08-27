import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow, formatPeriodForDay } from '@/lib/hours/openingHours'
import { districtLabel } from '@/lib/districts'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceCardProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
  origin?: { lat: number; lng: number } | null
}

export function SpaceCard({ space, isSelected, onSelect, origin = null }: SpaceCardProps) {
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayHours = formatPeriodForDay(space.opening_hours, now.getDay())
  const score = computeWorkcofyScore(space)
  const coverPhoto = space.photos?.find((photo) => photo.url)

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] ${
        isSelected ? 'border-black' : 'border-transparent'
      }`}
    >
      <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gray-100 transition-transform duration-200 group-hover:scale-[1.02]">
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={space.name} className="h-full w-full object-cover" />
        )}
        {space.verified && (
          <div className="absolute left-2 top-2">
            <VerifiedBadge />
          </div>
        )}
      </div>
      <h3 className="mt-3 font-semibold tracking-tight">{space.name}</h3>
      <p className="text-sm text-gray-500">{districtLabel(space.district)}</p>
      {space.data_source === 'mock' && (
        <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
          Datos de ejemplo
        </span>
      )}
      <div className="mt-1.5 flex items-center gap-2 text-sm">
        {space.rating != null && <span>★ {space.rating.toFixed(1)}</span>}
        {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
      </div>
      {score != null && (
        <p className="mt-1 text-xs font-semibold">
          Workcofy Score <span className="text-workcofy-yellow">{score}</span>
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">{openNow ? `Abierto · ${todayHours}` : 'Cerrado'}</p>
      <div className="mt-3.5 flex gap-2">
        <Link
          href={`/spaces/${space.slug}`}
          onClick={(event) => event.stopPropagation()}
          className="rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.97]"
        >
          Ver espacio
        </Link>
        <a
          href={buildDirectionsUrl(space, origin)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-black"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )
}
