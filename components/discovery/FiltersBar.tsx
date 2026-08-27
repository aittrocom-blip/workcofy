'use client'

import { CATEGORY_OPTIONS } from '@/lib/categories'
import { DISTRICTS } from '@/lib/districts'
import type { DiscoveryFilterState, SortOption } from '@/lib/filters/discoveryFilters'

interface FiltersBarProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  onRequestLocation: () => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Más cerca' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'open_now', label: 'Abierto ahora' },
]

export function FiltersBar({ filters, onChange, onRequestLocation }: FiltersBarProps) {
  const chipBase = 'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all'
  const chipActive = 'bg-black text-white shadow-sm'
  const chipInactive = 'border border-gray-200 text-gray-700 hover:border-black hover:text-black'

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange({ category: null })}
          className={`${chipBase} ${!filters.category ? chipActive : chipInactive}`}
        >
          Todos
        </button>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            disabled={!option.active}
            onClick={() => option.active && onChange({ category: option.value })}
            className={`${chipBase} ${
              filters.category === option.value ? chipActive : chipInactive
            } ${!option.active ? 'cursor-not-allowed opacity-40 hover:border-gray-200 hover:text-gray-700' : ''}`}
          >
            {option.label}
            {!option.active && ' · Próximamente'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {DISTRICTS.map((district) => (
          <button
            key={district.value}
            onClick={() =>
              onChange({ district: filters.district === district.value ? null : district.value })
            }
            className={`${chipBase} ${filters.district === district.value ? chipActive : chipInactive}`}
          >
            {district.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange({ sort: option.value })
              if (option.value === 'distance') onRequestLocation()
            }}
            className={`${chipBase} ${filters.sort === option.value ? chipActive : chipInactive}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
