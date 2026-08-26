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
  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange({ category: null })}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !filters.category ? 'bg-black text-white' : 'border border-gray-300'
          }`}
        >
          Todos
        </button>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            disabled={!option.active}
            onClick={() => option.active && onChange({ category: option.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.category === option.value ? 'bg-black text-white' : 'border border-gray-300'
            } ${!option.active ? 'cursor-not-allowed opacity-40' : ''}`}
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
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.district === district.value ? 'bg-black text-white' : 'border border-gray-300'
            }`}
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
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.sort === option.value ? 'bg-black text-white' : 'border border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
