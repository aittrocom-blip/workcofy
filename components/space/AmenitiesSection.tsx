import { groupedAmenityEntries } from '@/lib/amenities/groupedAmenityEntries'
import { AmenityIcon } from '@/components/space/AmenityIcon'
import type { AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

const CHIP_BASE = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium'

const CHIP_STATE = {
  available: `${CHIP_BASE} border-black bg-black text-white`,
  unavailable: `${CHIP_BASE} border-gray-200 bg-white text-gray-400`,
  // Most amenities are unknown until Google or the community confirms them —
  // dashed, but legible (not washed out), since these are exactly the chips
  // a user will eventually tap to confirm and earn Rewards for.
  unknown: `${CHIP_BASE} border-dashed border-gray-300 bg-white text-gray-500`,
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const groups = groupedAmenityEntries(amenities)

  return (
    <div className="mt-4 flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.groupKey}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {group.groupLabel}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {group.entries.map((entry) => {
              const state = entry.value === true ? 'available' : entry.value === false ? 'unavailable' : 'unknown'
              return (
                <span
                  key={entry.key}
                  className={CHIP_STATE[state]}
                  title={state === 'unknown' ? 'Información no disponible' : undefined}
                >
                  <AmenityIcon
                    name={entry.key}
                    className={`h-3 w-3 flex-none ${state === 'available' ? 'invert' : ''}`}
                  />
                  <span className={state === 'unavailable' ? 'line-through decoration-gray-300' : ''}>
                    {entry.label}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
