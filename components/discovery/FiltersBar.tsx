'use client'

import { useState, type FormEvent } from 'react'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { CategoryIcon } from '@/components/discovery/CategoryIcon'
import { FiltersPanel } from '@/components/discovery/FiltersPanel'
import { SortDropdown } from '@/components/discovery/SortDropdown'
import { OpenHoursFilter } from '@/components/discovery/OpenHoursFilter'
import type { DiscoveryFilterState } from '@/lib/filters/discoveryFilters'

interface FiltersBarProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  onRequestLocation: () => void
  resultCount: number
  /** Districts available in the currently selected country — empty until one is chosen. */
  availableDistricts: { value: string; label: string }[]
  /** True on a dedicated district route (/[district]), which is already locked to one zone. */
  hideLocationFilters?: boolean
  /** Renders as a floating card over the full-screen map instead of a full-width top bar. */
  floating?: boolean
  /** True on the full-screen map, where browsing is location-driven and typed search is redundant. */
  hideSearch?: boolean
}

const TILE_ACTIVE = CATEGORY_OPTIONS.filter((option) => option.active)
const TILE_MORE = CATEGORY_OPTIONS.filter((option) => !option.active)

export function FiltersBar({
  filters,
  onChange,
  onRequestLocation,
  resultCount,
  availableDistricts,
  hideLocationFilters = false,
  floating = false,
  hideSearch = false,
}: FiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? '')

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const trimmed = searchValue.trim()
    onChange({ search: trimmed || null })
  }

  const chipBase = 'flex-none rounded-full px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all'
  const chipActive = 'bg-black text-white shadow-sm'
  // Each chip carries its own white background + shadow rather than relying
  // on a shared card behind it — in `floating` mode there is no shared card
  // (see below), so every element needs to read as its own pill floating
  // directly over the map.
  const chipInactive =
    'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-black hover:text-black'

  return (
    <div
      className={
        floating
          ? // No shared card background/border here on purpose — each child
            // element (search bar, chips, tiles) is its own floating pill
            // with its own bg-white + shadow, so the map shows through the
            // gaps between them instead of one solid card sitting over it.
            ''
          : 'border-b border-gray-100 bg-white px-4 py-3 md:px-8'
      }
    >
      {/* Piso 1 — buscar, explorar cerca, filtrar, ordenar */}
      <div className="flex flex-wrap items-center gap-2">
        {!hideSearch && (
          <form onSubmit={submitSearch} className="min-w-0 flex-1 basis-full sm:min-w-[220px] sm:basis-auto">
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 shadow-sm transition-colors focus-within:border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-search.png" alt="" className="h-4 w-auto flex-none opacity-50" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="¿Dónde quieres trabajar?"
                aria-label="¿Dónde quieres trabajar?"
                className="min-w-0 flex-1 text-sm font-medium outline-none placeholder:font-semibold placeholder:text-black"
              />
            </div>
          </form>
        )}

        <button
          type="button"
          onClick={onRequestLocation}
          className={`${chipBase} flex items-center gap-1.5 ${chipInactive}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-near-me.png" alt="" className="h-3.5 w-auto" />
          Cerca de mí
        </button>

        {/* "Filtros" (Workcofy Verified) stays available for the non-floating
            toolbar (district pages) but is dropped from the floating map
            overlay — same declutter request as "Más cerca". */}
        {!floating && <FiltersPanel filters={filters} onChange={onChange} resultCount={resultCount} />}

        <OpenHoursFilter filters={filters} onChange={onChange} />

        {/* "Más cerca" (sort) stays available for the non-floating toolbar
            (district pages) but is dropped from the floating map overlay —
            explicit request to declutter that screen. */}
        {!floating && <SortDropdown value={filters.sort} onChange={(sort) => onChange({ sort })} />}
      </div>

      {/* Piso 2 — categorías y zonas populares */}
      <div className="mt-2.5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onChange({ category: null })}
            className={`flex flex-none flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              !filters.category ? chipActive : chipInactive
            }`}
          >
            <CategoryIcon name="todos" className={`h-8 w-8 ${!filters.category ? 'invert' : ''}`} />
            Todos
          </button>
          {TILE_ACTIVE.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ category: option.value })}
              className={`flex flex-none flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                filters.category === option.value ? chipActive : chipInactive
              }`}
            >
              <CategoryIcon
                name={option.value}
                className={`h-8 w-8 ${filters.category === option.value ? 'invert' : ''}`}
              />
              {option.label}
            </button>
          ))}
          {TILE_MORE.map((option) => (
            <div
              key={option.value}
              title="Próximamente"
              className="flex flex-none cursor-not-allowed flex-col items-center gap-1 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-gray-300 shadow-sm"
            >
              <CategoryIcon name={option.value} className="h-8 w-8 opacity-40" />
              {option.label}
            </div>
          ))}
        </div>

        {!hideLocationFilters && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRY_OPTIONS.map((country) => (
                <button
                  key={country.value}
                  onClick={() =>
                    onChange({ country: filters.country === country.value ? null : country.value })
                  }
                  className={`${chipBase} flex items-center gap-1 ${
                    filters.country === country.value ? chipActive : chipInactive
                  }`}
                >
                  <span aria-hidden="true">{country.flag}</span>
                  {country.label}
                </button>
              ))}
            </div>

            {filters.country && availableDistricts.length > 0 && (
              <>
                <span className="hidden text-xs font-medium text-gray-400 sm:inline">
                  Zonas populares:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableDistricts.map((district) => (
                    <button
                      key={district.value}
                      onClick={() =>
                        onChange({
                          district: filters.district === district.value ? null : district.value,
                        })
                      }
                      className={`${chipBase} ${
                        filters.district === district.value ? chipActive : chipInactive
                      }`}
                    >
                      {district.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
