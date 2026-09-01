'use client'

import { formatDistanceKm } from '@/lib/geo/haversine'
import { formatPriceLevel } from '@/lib/priceLevel'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { FavoriteButton } from '@/components/space/FavoriteButton'
import { isOpenNow } from '@/lib/hours/openingHours'
import { getLimaNow } from '@/lib/geo/limaTime'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface CompactSpaceRowProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
}

// Row layout for the vertical "popular near you" sidebar on the full-screen
// map — same info as CompactSpaceCard, just oriented for stacking instead
// of horizontal scrolling.
export function CompactSpaceRow({ space, isSelected, onSelect }: CompactSpaceRowProps) {
  const score = computeWorkcofyScore(space)
  const priceLevel = formatPriceLevel(space.price_level)
  const openNow = isOpenNow(space.opening_hours, getLimaNow())
  const coverPhoto = space.photos?.find((photo) => photo.url)
  const categoryLabel = CATEGORY_OPTIONS.find((option) => option.value === space.category)?.label

  return (
    <div
      className={`relative flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
        isSelected ? 'border-black bg-gray-50' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      {/* Covers the whole row for the select click — sits behind the
          FavoriteButton below since that one is `relative` and comes
          later in the DOM, which is what puts it on top. */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver ${space.name}`}
        className="absolute inset-0 rounded-xl"
      />
      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-gray-100">
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={space.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {categoryLabel && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {categoryLabel}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-sm font-semibold tracking-tight">{space.name}</h4>
          {space.verified && (
            <span className="flex-none scale-[0.7] origin-left">
              <VerifiedBadge />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              openNow ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-green-500' : 'bg-gray-300'}`} />
            {openNow ? 'Abierto' : 'Cerrado'}
          </span>
          {space.rating != null && (
            <span className="inline-flex items-center gap-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-star.png" alt="" className="h-2.5 w-2.5" />
              {space.rating.toFixed(1)}
            </span>
          )}
          {score != null && <span className="font-semibold text-workcofy-yellow">{score}</span>}
          {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
          {priceLevel && <span>{priceLevel}</span>}
        </div>
      </div>
      <FavoriteButton
        spaceId={space.id}
        className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full p-1.5 hover:bg-gray-100"
      />
    </div>
  )
}
