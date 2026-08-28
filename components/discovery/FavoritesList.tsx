'use client'

import { useRouter } from 'next/navigation'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface FavoritesListProps {
  spaces: SpaceRecord[]
}

// No map to sync selection with here (unlike the discovery grid this card
// is normally used in), so selecting a card just navigates to its full page.
export function FavoritesList({ spaces }: FavoritesListProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={{ ...space, distanceKm: null }}
          isSelected={false}
          onSelect={() => router.push(`/spaces/${space.slug}`)}
        />
      ))}
    </div>
  )
}
