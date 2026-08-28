'use client'

import { useEffect, useRef, useState } from 'react'
import type { DiscoveryFilterState } from '@/lib/filters/discoveryFilters'
import { countActiveFilters } from '@/lib/filters/discoveryFilters'

interface FiltersPanelProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  resultCount: number
}

// The "Filtros" button + its popover. Scoped to what actually has real data
// behind it today: Workcofy Verified. Amenity filters and "Beneficios
// Workcofy" are left out on purpose — amenities are unconfirmed `null` for
// nearly every space right now (see the internal verification tool), and no
// space has a row in space_benefits yet, so either filter would just return
// an empty list. Add them here once that data exists.
export function FiltersPanel({ filters, onChange, resultCount }: FiltersPanelProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeCount = countActiveFilters(filters)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
          activeCount > 0 ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-black hover:text-black'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/nav-filters.png"
          alt=""
          className={`h-3.5 w-3.5 ${activeCount > 0 ? 'invert' : ''}`}
        />
        Filtros
        {activeCount > 0 && (
          <span
            className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
              activeCount > 0 ? 'bg-workcofy-yellow text-workcofy-black' : ''
            }`}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Workcofy</h3>
          <label className="mt-2.5 flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-sm">
            <span className="inline-flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-check.png" alt="" className="h-3.5 w-3.5" />
              Workcofy Verified
            </span>
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(event) => onChange({ verifiedOnly: event.target.checked })}
              className="h-4 w-4 accent-black"
            />
          </label>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => onChange({ category: null, district: null, openNow: false, verifiedOnly: false })}
              className="text-xs font-semibold text-gray-500 hover:text-black"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
            >
              Ver {resultCount} espacios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
