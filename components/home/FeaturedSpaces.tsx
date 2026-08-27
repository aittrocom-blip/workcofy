'use client'

import { selectFeaturedSpaces } from '@/lib/discovery/selectFeaturedSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface FeaturedSpacesProps {
  spaces: SpaceRecord[]
}

export function FeaturedSpaces({ spaces }: FeaturedSpacesProps) {
  const featured = selectFeaturedSpaces(spaces)
  if (featured.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h2 className="text-2xl font-bold tracking-tight">Espacios destacados para ti</h2>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {featured.map((space) => (
          <div key={space.id} className="w-64 flex-none">
            <SpaceCard
              space={{ ...space, distanceKm: null }}
              isSelected={false}
              onSelect={() => {}}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
