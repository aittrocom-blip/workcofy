'use client'

import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow } from '@/lib/hours/openingHours'
import { getLimaNow } from '@/lib/geo/limaTime'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface NearbyPopularStripProps {
  spaces: SpaceWithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
}

// Google-Maps-style bottom carousel for the full-screen map: a horizontally
// scrolling row of small floating cards (wide photo on top, one line of
// basic info below) instead of the tall vertical "popular near you" list
// this replaces. Each card is its own translucent chip, not one long bar,
// so it reads as floating over the map rather than a UI panel docked to it.
export function NearbyPopularStrip({ spaces, selectedId, onSelect }: NearbyPopularStripProps) {
  if (spaces.length === 0) return null

  return (
    <HorizontalScroller className="gap-2.5 pb-1">
      {spaces.map((space) => {
        const openNow = isOpenNow(space.opening_hours, getLimaNow())
        const categoryLabel = CATEGORY_OPTIONS.find((option) => option.value === space.category)?.label ?? space.category
        const coverPhoto = space.photos?.find((photo) => photo.url)
        const isSelected = space.id === selectedId

        return (
          <button
            key={space.id}
            type="button"
            onClick={() => onSelect(space.id)}
            className={`flex w-44 flex-none flex-col overflow-hidden rounded-2xl border bg-white/90 text-left shadow-[0_12px_30px_rgba(17,24,39,0.14)] backdrop-blur-md transition-all hover:-translate-y-0.5 ${
              isSelected ? 'border-black' : 'border-white/70'
            }`}
          >
            <div className="h-20 w-full flex-none bg-gray-100">
              {coverPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhoto.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold tracking-tight">{space.name}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-500">
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${openNow ? 'bg-green-500' : 'bg-gray-300'}`} />
                {categoryLabel}
                {space.distanceKm != null && ` · ${formatDistanceKm(space.distanceKm)}`}
              </p>
            </div>
          </button>
        )
      })}
    </HorizontalScroller>
  )
}
