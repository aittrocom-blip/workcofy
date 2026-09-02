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
  const [sort, setSort] = useState<SortOption>('distance')
  const [visibleCount, setVisibleCount] = useState(10)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mapRef = useRef<MapViewHandle>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return withDistance.filter((space) => {
      if (category && space.category !== category) return false
      if (
        term &&
        !space.name.toLowerCase().includes(term) &&
        !(space.address ?? '').toLowerCase().includes(term)
      ) {
        return false
      }
      return true
    })
  }, [withDistance, search, category])

  const sortedFiltered = useMemo(() => sortSpaces(filtered, sort), [filtered, sort])
  const visibleSpaces = sortedFiltered.slice(0, visibleCount)

  useEffect(() => {
    setVisibleCount(10)
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/nav-search.png"
            alt=""
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar espacios, barrios o lugares..."
            className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm font-medium text-black shadow-sm outline-none focus:border-black"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/nav-search.png"
            alt=""
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40"
          />
        </div>
        <span
          title="Próximamente"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-near-me.png" alt="" className="h-3.5 w-3.5 opacity-40" />
          Ubicación
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-chevron-down.png" alt="" className="h-3 w-3 opacity-40" />
        </span>
        <span
          title="Próximamente"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
          </svg>
          Tipo de espacio
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-chevron-down.png" alt="" className="h-3 w-3 opacity-40" />
        </span>
        <span
          title="Próximamente"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2 5-5 2 2-5 5-2z" />
          </svg>
          Ambiente
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-chevron-down.png" alt="" className="h-3 w-3 opacity-40" />
        </span>
        <span
          title="Próximamente"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-filters.png" alt="" className="h-3.5 w-3.5 opacity-40" />
          Más filtros
        </span>
      </div>

      {(search || category) && (
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setCategory(null)
            }}
            className="text-xs font-medium text-gray-400 hover:text-black hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            category === null
              ? 'bg-black text-white'
              : 'border border-gray-200 text-gray-700 hover:border-black'
          }`}
        >
          Todos
        </button>
        {CATEGORY_OPTIONS.map((option) =>
          option.active ? (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                category === option.value
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-700 hover:border-black'
              }`}
            >
              {option.label}
            </button>
          ) : (
            <span
              key={option.value}
              title="Próximamente"
              className="cursor-not-allowed rounded-full border border-dashed border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300"
            >
              {option.label}
            </span>
          )
        )}
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

          {visibleCount < sortedFiltered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 10)}
              className="mt-4 w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:border-black"
            >
              Ver más espacios
            </button>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="sticky top-6 h-[70vh] overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="relative h-full w-full">
              <MapView
                ref={mapRef}
                center={coordinate}
                zoom={13}
                markers={sideMapMarkers}
                selectedMarkerId={selectedId}
                onMarkerSelect={setSelectedId}
                userLocation={status === 'granted' ? coordinate : null}
              />
              {/* Quick View — selecting a row or a pin centers the map here
                  and drops this preview over it; "Ver espacio" inside it is
                  the "Ver ficha completa" action. */}
              {selectedSpace && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center p-4">
                  <div className="pointer-events-auto w-full max-w-xs">
                    <SpaceCard
                      space={selectedSpace}
                      isSelected
                      onSelect={() => {}}
                      origin={status === 'granted' ? coordinate : null}
                    />
                  </div>
                </div>
              )}
            </div>
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
    </div>
  )
}
