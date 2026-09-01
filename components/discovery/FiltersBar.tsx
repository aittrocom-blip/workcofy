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
  /** Hides the advanced filters popover when the map needs a lighter toolbar. */
  hideFiltersPanel?: boolean
  /** Gives the full-screen map its own compact, unified control surface. */
  mapOverlay?: boolean
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
  hideFiltersPanel = false,
  mapOverlay = false,
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

  const isMapOverlay = floating && mapOverlay

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
      <div className={`flex flex-wrap items-center gap-2 ${isMapOverlay ? 'md:flex-nowrap' : ''}`}>
        {!hideSearch && (
          <form
            onSubmit={submitSearch}
            className={`min-w-0 flex-1 basis-full sm:min-w-[260px] sm:basis-auto ${isMapOverlay ? 'md:basis-auto' : ''}`}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-colors focus-within:border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-search.png" alt="" className="h-5 w-auto flex-none" />
              <div className="min-w-0 flex-1">
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="¿Dónde quieres trabajar?"
                  aria-label="¿Dónde quieres trabajar?"
                  className="w-full text-sm font-semibold text-black outline-none placeholder:font-semibold placeholder:text-black"
                />
                {/* Static hint of what can be searched — disappears once the
                    user starts typing, so it never overlaps a real value. */}
                {searchValue === '' && (
                  <p className="truncate text-xs text-gray-400">Café, coworking, salas de reunión...</p>
                )}
              </div>
            </div>
          </form>
        )}

        {!isMapOverlay && (
          <button
            type="button"
            onClick={onRequestLocation}
            className={`${chipBase} flex items-center gap-1.5 ${chipInactive}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/nav-near-me.png" alt="" className="h-3.5 w-auto" />
            Cerca de mí
          </button>
        )}

        {!isMapOverlay && <OpenHoursFilter filters={filters} onChange={onChange} />}

        {!hideFiltersPanel && (
          <FiltersPanel filters={filters} onChange={onChange} resultCount={resultCount} />
        )}

        {/* "Más cerca" (sort) stays available for the non-floating toolbar
            (district pages) but is dropped from the floating map overlay —
            explicit request to declutter that screen. */}
        {!floating && <SortDropdown value={filters.sort} onChange={(sort) => onChange({ sort })} />}
      </div>

      {/* Piso 2 — categorías y zonas populares */}
      <div className="mt-2.5 flex flex-wrap items-center gap-4">
        <div
          className={`gap-1.5 ${
            isMapOverlay
              ? 'no-scrollbar -mx-3 flex flex-nowrap overflow-x-auto px-3 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0'
              : 'flex flex-wrap'
          }`}
        >
          {isMapOverlay && (
            <button
              type="button"
              onClick={onRequestLocation}
              aria-label="Cerca de mí"
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:border-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-near-me.png" alt="" className="h-5 w-auto" />
            </button>
          )}
          {isMapOverlay && <OpenHoursFilter filters={filters} onChange={onChange} variant="chip" />}
          <button
            onClick={() => onChange({ category: null })}
            className={`flex flex-none items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
              !filters.category ? chipActive : chipInactive
            }`}
          >
            <CategoryIcon name="todos" className={`h-5 w-5 ${!filters.category ? 'invert' : ''}`} />
            Todos
          </button>
          {TILE_ACTIVE.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ category: option.value })}
              className={`flex flex-none items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                filters.category === option.value ? chipActive : chipInactive
              }`}
            >
              <CategoryIcon
                name={option.value}
                className={`h-5 w-5 ${filters.category === option.value ? 'invert' : ''}`}
              />
              {option.label}
            </button>
          ))}
          {!isMapOverlay && TILE_MORE.map((option) => (
            <div
              key={option.value}
              title="Próximamente"
              className="flex flex-none cursor-not-allowed items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-sm"
            >
              <CategoryIcon name={option.value} className="h-5 w-5 opacity-40" />
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
