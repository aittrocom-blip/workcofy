'use client'

import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow } from '@/lib/hours/openingHours'
import { getLimaNow } from '@/lib/geo/limaTime'
import { districtLabel } from '@/lib/districts'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { FavoriteButton } from '@/components/space/FavoriteButton'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'
import { topAmenityHighlights } from '@/lib/amenities/highlights'

interface SpotCardProps {
  space: SpaceWithDistance
  /** tile: fixed-width card for horizontal strips. row: full-width list item. */
  variant?: 'tile' | 'row'
}

// "Workcofy Spot" (spaces.verified — an affiliated, verified venue in the
// network) vs. a regular place, which shows its real category (Café
// Workfriendly / Cowork Café / Coworking / Lobby Café — the same
// CATEGORY_OPTIONS label the map uses) so the chip always matches the
// space's data. Card taps go to the space's full page.
export function SpotBadge({ verified, label, className = '' }: { verified: boolean; label: string; className?: string }) {
  if (verified) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-workcofy-yellow" />
        Workcofy Spot
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-700 backdrop-blur ${className}`}>
      {label}
    </span>
  )
}

export function SpotCard({ space, variant = 'tile' }: SpotCardProps) {
  const openNow = isOpenNow(space.opening_hours, getLimaNow())
  const coverPhoto = space.photos?.find((photo) => photo.url)
  const categoryLabel = CATEGORY_OPTIONS.find((option) => option.value === space.category)?.label ?? space.category
  const href = `/spaces/${space.slug}`
  const highlights = topAmenityHighlights(space.amenities, 2)

  if (variant === 'row') {
    return (
      <div className="relative flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-2.5 transition-colors active:bg-gray-50">
        <Link href={href} aria-label={`Ver ${space.name}`} className="absolute inset-0 rounded-2xl" />
        <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-gray-100">
          {coverPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <SpotBadge verified={space.verified} label={categoryLabel} className={space.verified ? '' : 'bg-gray-100'} />
          <h3 className="mt-1 truncate text-[15px] font-bold tracking-tight">{space.name}</h3>
          <p className="truncate text-xs text-gray-500">
            {districtLabel(space.district)}
            {space.distanceKm != null && ` · ${formatDistanceKm(space.distanceKm)}`}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 font-medium ${openNow ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-green-500' : 'bg-gray-300'}`} />
              {openNow ? 'Abierto' : 'Cerrado'}
            </span>
            {space.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/nav-star.png" alt="" className="h-2.5 w-2.5" />
                {space.rating.toFixed(1)}
              </span>
            )}
          </p>
        </div>
        <FavoriteButton spaceId={space.id} className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full p-2" />
      </div>
    )
  }

  return (
    <div className="relative w-[168px] flex-none">
      <Link href={href} className="block active:scale-[0.98]">
        <div className="relative h-32 w-full overflow-hidden rounded-[20px] bg-gray-100">
          {coverPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPhoto.url} alt="" className="h-full w-full object-cover" />
          )}
          <SpotBadge verified={space.verified} label={categoryLabel} className="absolute left-2 top-2" />
        </div>
        <h3 className="mt-2.5 truncate text-[15px] font-bold leading-tight tracking-tight">{space.name}</h3>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {districtLabel(space.district)}
          {space.distanceKm != null && ` · ${formatDistanceKm(space.distanceKm)}`}
        </p>
        {highlights.length > 0 && (
          <p className="mt-1 flex gap-1 overflow-hidden whitespace-nowrap text-[10px] font-semibold text-gray-600">
            {highlights.map((highlight) => <span key={highlight} className="rounded-full bg-gray-100 px-1.5 py-0.5">{highlight}</span>)}
          </p>
        )}
        <p className="mt-1 flex items-center gap-2 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={openNow ? 'text-green-600' : 'text-gray-400'}>{openNow ? 'Abierto' : 'Cerrado'}</span>
          {space.rating != null && (
            <span className="inline-flex items-center gap-0.5 text-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-star.png" alt="" className="h-2.5 w-2.5" />
              {space.rating.toFixed(1)}
            </span>
          )}
        </p>
      </Link>
      <FavoriteButton
        spaceId={space.id}
        className="absolute left-2 top-[5.5rem] flex h-8 w-8 items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur"
      />
    </div>
  )
}
