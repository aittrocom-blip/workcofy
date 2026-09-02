'use client'

import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { formatPriceLevel } from '@/lib/priceLevel'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { districtLabel } from '@/lib/districts'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { CategoryIcon } from '@/components/discovery/CategoryIcon'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { FavoriteButton } from '@/components/space/FavoriteButton'
import { useFavorites } from '@/components/providers/FavoritesProvider'
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
  const { loggedIn } = useFavorites()
  const score = computeWorkcofyScore(space)
  const priceLevel = formatPriceLevel(space.price_level)
  const openNow = isOpenNow(space.opening_hours, getLimaNow())
  const coverPhoto = space.photos?.find((photo) => photo.url)
  const categoryLabel = CATEGORY_OPTIONS.find((option) => option.value === space.category)?.label ?? space.category

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
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {districtLabel(space.district)}
          {space.distanceKm != null && ` · ${formatDistanceKm(space.distanceKm)}`}
        </p>
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
            <span className="inline-flex items-center gap-0.5 sm:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-star.png" alt="" className="h-2.5 w-2.5" />
              {space.rating.toFixed(1)}
            </span>
          )}
          {score != null && <span className="font-semibold text-workcofy-yellow">{score} Score</span>}
          {priceLevel && <span className="sm:hidden">{priceLevel}</span>}
        </div>
      </div>
      <div className="hidden flex-none flex-wrap items-center justify-end gap-1.5 sm:flex sm:max-w-[180px]">
        <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
          <CategoryIcon name={space.category} className="h-3.5 w-3.5" />
          {categoryLabel}
        </div>
        {priceLevel && (
          <span className="rounded-full bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">{priceLevel}</span>
        )}
        {space.rating != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/nav-star.png" alt="" className="h-3 w-3" />
            {space.rating.toFixed(1)}
          </span>
        )}
      </div>
      {loggedIn && (
        <Link
          href={`/spaces/${space.slug}`}
          onClick={(event) => event.stopPropagation()}
          title="Más información"
          className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
          </svg>
        </Link>
      )}
      <FavoriteButton
        spaceId={space.id}
        className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full p-1.5 hover:bg-gray-100"
      />
    </div>
  )
}
