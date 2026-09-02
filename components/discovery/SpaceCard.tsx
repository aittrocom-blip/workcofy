'use client'

import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow, formatPeriodForDay } from '@/lib/hours/openingHours'
import { districtLabel } from '@/lib/districts'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { formatPriceLevel } from '@/lib/priceLevel'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { CategoryIcon } from '@/components/discovery/CategoryIcon'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { FavoriteButton } from '@/components/space/FavoriteButton'
import { useFavorites } from '@/components/providers/FavoritesProvider'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceCardProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
  origin?: { lat: number; lng: number } | null
  /** When provided, "Ver espacio" calls this instead of navigating to the standalone /spaces/[slug] page — used on the full-screen map so the detail opens in place instead of leaving the sidebar shell. */
  onViewDetail?: () => void
  /** When true, this card renders dimmed if the space is currently closed — set from the "Abierto" filter, which highlights rather than hides. */
  dimClosed?: boolean
}

export function SpaceCard({ space, isSelected, onSelect, origin = null, onViewDetail, dimClosed = false }: SpaceCardProps) {
  const { loggedIn } = useFavorites()
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayHours = formatPeriodForDay(space.opening_hours, now.getDay())
  const dimmed = dimClosed && !openNow
  const spaceUrl = `/spaces/${space.slug}`
  const viewSpaceButtonClass =
    'whitespace-nowrap rounded-full border border-black bg-white px-3.5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]'
  const score = computeWorkcofyScore(space)
  const priceLevel = formatPriceLevel(space.price_level)
  const categoryLabel = CATEGORY_OPTIONS.find((option) => option.value === space.category)?.label ?? space.category
  const coverPhoto = space.photos?.find((photo) => photo.url)

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] ${
        isSelected ? 'border-black' : 'border-transparent'
      } ${dimmed ? 'opacity-45 hover:opacity-100' : ''}`}
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
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold shadow-sm">
          <CategoryIcon name={space.category} className="h-3.5 w-3.5" />
          {categoryLabel}
        </div>
        <FavoriteButton
          spaceId={space.id}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-colors"
        />
      </div>
      <h3 title={space.name} className="mt-3 line-clamp-2 min-h-[2.75rem] font-semibold leading-snug tracking-tight">
        {space.name}
      </h3>
      <p className="text-sm text-gray-500">{districtLabel(space.district)}</p>
      {space.data_source === 'mock' && (
        <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
          Datos de ejemplo
        </span>
      )}
      <div className="mt-1.5 flex items-center gap-2 text-sm">
        {space.rating != null && (
          <span className="inline-flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/nav-star.png" alt="" className="h-3 w-3" />
            {space.rating.toFixed(1)}
          </span>
        )}
        {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
        {priceLevel && <span className="text-gray-500">{priceLevel}</span>}
      </div>
      {score != null && (
        <p className="mt-1 text-xs font-semibold">
          Workcofy Score <span className="text-workcofy-yellow">{score}</span>
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">{openNow ? `Abierto · ${todayHours}` : 'Cerrado'}</p>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {!loggedIn ? (
          // Not signed in — always send to login (never onViewDetail, even
          // inside the full-screen map), landing back on this space's own
          // page afterward since the in-place map panel has no shareable URL
          // of its own to return to.
          <Link
            href={`/login?next=${encodeURIComponent(spaceUrl)}`}
            onClick={(event) => event.stopPropagation()}
            className={viewSpaceButtonClass}
          >
            Ver espacio
          </Link>
        ) : onViewDetail ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onViewDetail()
            }}
            className={viewSpaceButtonClass}
          >
            Ver espacio
          </button>
        ) : (
          <Link href={spaceUrl} onClick={(event) => event.stopPropagation()} className={viewSpaceButtonClass}>
            Ver espacio
          </Link>
        )}
        <a
          href={buildDirectionsUrl(space, origin)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="whitespace-nowrap rounded-full border border-gray-200 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:border-black"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )
}
