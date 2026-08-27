import { groupedAmenityEntries } from '@/lib/amenities/groupedAmenityEntries'
import type { AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const groups = groupedAmenityEntries(amenities)

  return (
    <div className="mt-4">
      {groups.map((group) => (
        <div key={group.groupKey} className="mt-5 first:mt-0">
          <h3 className="text-sm font-semibold tracking-tight">{group.groupLabel}</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {group.entries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2">
                {entry.value === true && <span className="text-workcofy-yellow">✓</span>}
                {entry.value === false && <span className="text-gray-300">✕</span>}
                {entry.value === null && <span className="text-gray-300">·</span>}
                <span className={entry.value === null ? 'text-gray-400' : ''}>
                  {entry.value === null ? `${entry.label} — Información no disponible` : entry.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
