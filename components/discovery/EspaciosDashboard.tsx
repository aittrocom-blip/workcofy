'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { sortSpaces } from '@/lib/filters/sortSpaces'
import type { SortOption } from '@/lib/filters/discoveryFilters'
import { SortDropdown } from '@/components/discovery/SortDropdown'
import { CompactSpaceRow } from '@/components/discovery/CompactSpaceRow'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { districtLabel } from '@/lib/districts'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { MapView } from '@/components/map/MapView'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import type { MapViewHandle } from '@/lib/map/types'

interface EspaciosDashboardProps {
  spaces: SpaceRecord[]
  isAdmin: boolean
}

export function EspaciosDashboard({ spaces, isAdmin }: EspaciosDashboardProps) {
  const { coordinate, status, requestLocation } = useUserLocation()
  useEffect(() => {
    if (status === 'idle') {
      requestLocation()
    }
  }, [status, requestLocation])

  const withDistance = useSpacesWithDistance(spaces, coordinate, status)
  const recommended = useMemo(() => selectNearbyPopularSpaces(withDistance, 8), [withDistance])

  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(searchParams.get('category'))
  const [district, setDistrict] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('distance')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<'ubicacion' | 'tipo' | 'ambiente' | 'filtros' | null>(null)
  const mapRef = useRef<MapViewHandle>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return withDistance.filter((space) => {
      if (category && space.category !== category) return false
      if (district && space.district !== district) return false
      if (
        term &&
        !space.name.toLowerCase().includes(term) &&
        !(space.address ?? '').toLowerCase().includes(term)
      ) {
        return false
      }
      return true
    })
  }, [withDistance, search, category, district])

  const sortedFiltered = useMemo(() => sortSpaces(filtered, sort), [filtered, sort])
  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE))
  const visibleSpaces = sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [filtered])

  const selectedSpace = sortedFiltered.find((space) => space.id === selectedId) ?? null

  // Centers the map on whatever got selected — from a list row or a marker
  // click — so picking a place always brings it into view, matching how the
  // full-screen map already behaves.
  useEffect(() => {
    if (selectedSpace?.latitude != null && selectedSpace?.longitude != null) {
      mapRef.current?.centerOn({ lat: selectedSpace.latitude, lng: selectedSpace.longitude }, 15)
    }
  }, [selectedId])

  const sideMapMarkers = sortedFiltered
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
      photoUrl: space.photos?.find((photo) => photo.url)?.url ?? null,
      favorited: false,
      dimmed: false,
    }))

  // Every category, including the not-yet-filterable ones — this widget is
  // informational only, so it's fine (and honest) to show a real 0 for a
  // category with no filter behind it yet.
  const categoryCounts = CATEGORY_OPTIONS.map((option) => ({
    ...option,
    count: withDistance.filter((space) => space.category === option.value).length,
  }))

  // Districts actually present in the data, grouped by country and sorted
  // by how many spaces each one has — feeds the "Ubicación" dropdown.
  const districtGroups = useMemo(() => {
    const byCountry = new Map<string, Map<string, number>>()
    withDistance.forEach((space) => {
      const districts = byCountry.get(space.country) ?? new Map<string, number>()
      districts.set(space.district, (districts.get(space.district) ?? 0) + 1)
      byCountry.set(space.country, districts)
    })
    const countryOrder = [...COUNTRY_OPTIONS.map((option) => option.value), ...byCountry.keys()]
    return Array.from(new Set(countryOrder))
      .filter((countryValue) => byCountry.has(countryValue))
      .map((countryValue) => ({
        value: countryValue,
        label: COUNTRY_OPTIONS.find((option) => option.value === countryValue)?.label ?? countryValue,
        districts: Array.from(byCountry.get(countryValue)!.entries())
          .map(([value, count]) => ({ value, label: districtLabel(value), count }))
          .sort((a, b) => b.count - a.count),
      }))
  }, [withDistance])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Espacios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Encuentra los mejores lugares para trabajar, reunirte y enfocarte.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/espacios/nuevo"
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:border-black"
            >
              + Agregar espacio
            </Link>
          )}
          <Link
            href="/near-me?view=map"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
          >
            Mapa
          </Link>
        </div>
      </div>

      {/* The main interaction from here down — buscar → descubrir → comparar
          → elegir → llegar — replaces the old metrics-first header. */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar espacios, barrios o lugares..."
            className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-black shadow-sm outline-none focus:border-black"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === 'ubicacion' ? null : 'ubicacion'))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              district ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-black'
            }`}
          >
            <PinIcon className="h-3.5 w-3.5" />
            {district ? districtLabel(district) : 'Ubicación'}
            <ChevronIcon className={`h-3 w-3 transition-transform ${openDropdown === 'ubicacion' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'ubicacion' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setDistrict(null)
                    setOpenDropdown(null)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                    district === null ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos los distritos
                </button>
                {districtGroups.map((group) => (
                  <div key={group.value} className="mt-1 first:mt-0">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {group.label}
                    </p>
                    {group.districts.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDistrict(option.value)
                          setOpenDropdown(null)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                          district === option.value ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                        <span className={district === option.value ? 'text-white/70' : 'text-gray-400'}>{option.count}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === 'tipo' ? null : 'tipo'))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
              category ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-black'
            }`}
          >
            <GridIcon className="h-3.5 w-3.5" />
            {category ? CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? 'Tipo de espacio' : 'Tipo de espacio'}
            <ChevronIcon className={`h-3 w-3 transition-transform ${openDropdown === 'tipo' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'tipo' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setCategory(null)
                    setOpenDropdown(null)
                  }}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                    category === null ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                {CATEGORY_OPTIONS.filter((option) => option.active).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setCategory(option.value)
                      setOpenDropdown(null)
                    }}
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      category === option.value ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === 'ambiente' ? null : 'ambiente'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-black"
          >
            <CompassIcon className="h-3.5 w-3.5" />
            Ambiente
            <ChevronIcon className={`h-3 w-3 transition-transform ${openDropdown === 'ambiente' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'ambiente' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-lg">
                Muy pronto podrás filtrar por ambiente y comodidades.
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((current) => (current === 'filtros' ? null : 'filtros'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-black"
          >
            <FilterIcon className="h-3.5 w-3.5" />
            Más filtros
          </button>
          {openDropdown === 'filtros' && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-lg">
                Muy pronto podrás combinar más filtros aquí.
              </div>
            </>
          )}
        </div>
      </div>

      {(search || category || district) && (
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setCategory(null)
              setDistrict(null)
            }}
            className="text-xs font-medium text-gray-400 hover:text-black hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Explora espacios</h2>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {visibleSpaces.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No encontramos espacios con estos filtros.
              </p>
            ) : (
              visibleSpaces.map((space) => (
                <CompactSpaceRow
                  key={space.id}
                  space={space}
                  isSelected={space.id === selectedId}
                  onSelect={() => setSelectedId(space.id)}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200"
              >
                ‹ Anterior
              </button>
              <span className="text-sm font-medium text-gray-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200"
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-semibold">Explorar en el mapa</h3>
            <div className="mt-3 h-[200px] overflow-hidden rounded-xl">
              <MapView
                ref={mapRef}
                center={coordinate}
                zoom={12}
                markers={sideMapMarkers}
                selectedMarkerId={selectedId}
                onMarkerSelect={setSelectedId}
                userLocation={status === 'granted' ? coordinate : null}
                hideNativeZoom
              />
            </div>
            <Link
              href="/near-me?view=map"
              className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-black hover:underline"
            >
              Ver todos en el mapa
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4h6v6M20 4l-8 8M6 6H5a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tipos de espacios</h3>
              <span title="Próximamente" className="cursor-not-allowed text-xs font-semibold text-gray-300">
                Ver todos →
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2.5">
              {categoryCounts.map((option) => (
                <li key={option.value} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{option.label}</span>
                  <span className="text-gray-400">{option.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold">¿Tienes un espacio?</h3>
            <p className="mt-1 text-xs text-gray-500">
              Únete a Workcofy y llega a miles de personas que buscan dónde trabajar.
            </p>
            <span
              title="Próximamente"
              className="mt-3 inline-flex cursor-not-allowed items-center rounded-full bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-400"
            >
              Agregar mi espacio
            </span>
          </div>
        </aside>
      </div>

      {recommended.length > 0 && (
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Recomendados para ti</h2>
              <p className="mt-0.5 text-sm text-gray-500">Cerca de ti y populares en la comunidad.</p>
            </div>
            <span title="Próximamente" className="cursor-not-allowed text-sm font-semibold text-gray-300">
              Ver todos →
            </span>
          </div>
          <HorizontalScroller className="mt-4 gap-4 pb-1">
            {recommended.map((space) => (
              <div key={space.id} className="w-64 flex-none">
                <SpaceCard
                  space={space}
                  isSelected={false}
                  onSelect={() => {}}
                  origin={status === 'granted' ? coordinate : null}
                />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-5 2 2-5 5-2z" />
    </svg>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
      <circle cx="9" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
      <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round" />
      <circle cx="7" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
