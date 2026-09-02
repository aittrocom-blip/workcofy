'use client'

import type { DiscoveryFilterState } from '@/lib/filters/discoveryFilters'

interface OpenHoursFilterProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  /** 'chip' matches the category-chip look (icon + text-sm, same sizing as Todos/Café/...) for bars that place this alongside those chips. */
  variant?: 'default' | 'chip'
}

// A single on/off toggle for "only show spaces open right now" — no
// dropdown, no time-range picker, just click to filter and click again to
// clear it.
export function OpenHoursFilter({ filters, onChange, variant = 'default' }: OpenHoursFilterProps) {
  const active = filters.openNow

  function toggleOpenNow() {
    onChange(filters.openNow ? { openNow: false } : { openNow: true, openBetween: null })
  }

  return (
    <button
      type="button"
      onClick={toggleOpenNow}
      aria-pressed={active}
      className={
        variant === 'chip'
          ? `flex h-[42px] flex-none items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
              active ? 'bg-black text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-black hover:text-black'
            }`
          : `flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold shadow-sm transition-all ${
              active
                ? 'bg-black text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black'
            }`
      }
    >
      {variant === 'chip' ? (
        <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? 'text-green-400' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
      )}
      Abierto
    </button>
  )
}
