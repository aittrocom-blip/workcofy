import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceListProps {
  spaces: SpaceWithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
  onClearFilters?: () => void
  origin?: { lat: number; lng: number } | null
  /** When true, spaces that are currently closed render dimmed instead of full-opacity — see SpaceCard. */
  dimClosed?: boolean
}

export function SpaceList({
  spaces,
  selectedId,
  onSelect,
  onClearFilters,
  origin = null,
  dimClosed = false,
}: SpaceListProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <p className="text-sm font-semibold text-black">No encontramos espacios aquí</p>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          Prueba con otra zona o quita algún filtro para ampliar la búsqueda.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Quitar filtros
          </button>
        )}
      </div>
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
