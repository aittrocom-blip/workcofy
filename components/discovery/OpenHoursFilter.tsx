'use client'

import { useEffect, useRef, useState } from 'react'
import type { DiscoveryFilterState } from '@/lib/filters/discoveryFilters'

interface OpenHoursFilterProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
}

// Replaces the old plain "Abierto ahora" toggle button with a dropdown that
// keeps that same quick toggle plus a "horario específico" time-range option
// — the two are mutually exclusive (both answer "how do I want to filter by
// hours"), matching the FiltersPanel/SortDropdown popover pattern already
// used elsewhere in this bar.
export function OpenHoursFilter({ filters, onChange }: OpenHoursFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(filters.openBetween?.start ?? '09:00')
  const [end, setEnd] = useState(filters.openBetween?.end ?? '18:00')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const active = filters.openNow || filters.openBetween !== null

  function toggleOpenNow() {
    onChange(filters.openNow ? { openNow: false } : { openNow: true, openBetween: null })
  }

  function applyRange() {
    onChange({ openBetween: { start, end }, openNow: false })
    setOpen(false)
  }

  function clearRange() {
    onChange({ openBetween: null })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold shadow-sm transition-all ${
          active
            ? 'bg-black text-white'
            : 'border border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${filters.openNow ? 'bg-workcofy-yellow' : 'bg-green-500'}`} />
        {filters.openBetween ? `${filters.openBetween.start}–${filters.openBetween.end}` : 'Abierto ahora'}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={toggleOpenNow}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
              filters.openNow ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-700 hover:border-black'
            }`}
          >
            Abierto ahora mismo
            {filters.openNow && <span>✓</span>}
          </button>

          <div className="mt-4 border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Horario específico</h3>
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="time"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-black outline-none focus:border-black"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-black outline-none focus:border-black"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={clearRange}
                className="text-xs font-semibold text-gray-500 hover:text-black"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={applyRange}
                className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
              >
                Aplicar horario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
