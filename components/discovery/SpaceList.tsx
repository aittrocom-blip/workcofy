import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceListProps {
  spaces: SpaceWithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
  origin?: { lat: number; lng: number } | null
  /** When true, spaces that are currently closed render dimmed instead of full-opacity — see SpaceCard. */
  dimClosed?: boolean
}

export function SpaceList({ spaces, selectedId, onSelect, origin = null, dimClosed = false }: SpaceListProps) {
  if (spaces.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-gray-500">
        No encontramos espacios con estos filtros. Prueba con otro distrito o búsqueda.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={space}
          isSelected={space.id === selectedId}
          onSelect={() => onSelect(space.id)}
          origin={origin}
          dimClosed={dimClosed}
        />
      ))}
    </div>
  )
}
