'use client'

import { formatDistanceKm } from '@/lib/geo/haversine'
import { formatPriceLevel } from '@/lib/priceLevel'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
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
  const coverPhoto = space.photos?.find((photo) => photo.url)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
        isSelected ? 'border-black bg-gray-50' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-gray-100">
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={space.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-sm font-semibold tracking-tight">{space.name}</h4>
          {space.verified && (
            <span className="flex-none scale-[0.7] origin-left">
              <VerifiedBadge />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
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
    </button>
  )
}
