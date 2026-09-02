'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { districtLabel } from '@/lib/districts'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import { sortSpaces } from '@/lib/filters/sortSpaces'
import type { SortOption } from '@/lib/filters/discoveryFilters'
import { SortDropdown } from '@/components/discovery/SortDropdown'
import { CompactSpaceRow } from '@/components/discovery/CompactSpaceRow'
import { CATEGORY_OPTIONS } from '@/lib/categories'

interface EspaciosDashboardProps {
  spaces: SpaceRecord[]
  isAdmin: boolean
}

export function EspaciosDashboard({ spaces, isAdmin }: EspaciosDashboardProps) {
  const withDistance = useSpacesWithDistance(spaces)

  const verifiedCount = withDistance.filter((space) => space.verified).length
  const wellRatedCount = withDistance.filter((space) => space.rating != null && space.rating >= 4).length
  const wellRatedPct =
    withDistance.length > 0 ? Math.round((wellRatedCount / withDistance.length) * 100) : 0

  const districtCounts = new Map<string, number>()
  for (const space of withDistance) {
    districtCounts.set(space.district, (districtCounts.get(space.district) ?? 0) + 1)
  }
  let topDistrict: string | null = null
  let topDistrictCount = 0
  for (const [district, count] of districtCounts) {
    if (count > topDistrictCount) {
      topDistrict = district
      topDistrictCount = count
    }
  }

  const recommended = useMemo(() => selectNearbyPopularSpaces(withDistance, 8), [withDistance])

  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('distance')
  const [visibleCount, setVisibleCount] = useState(10)

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
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{withDistance.length}</p>
          <p className="mt-1 text-xs text-gray-500">Espacios registrados</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{verifiedCount}</p>
          <p className="mt-1 text-xs text-gray-500">Workcofy Spots verificados</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{wellRatedPct}%</p>
          <p className="mt-1 text-xs text-gray-500">Con buena calificación</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{topDistrict ? districtLabel(topDistrict) : '—'}</p>
          <p className="mt-1 text-xs text-gray-500">Ubicación más popular</p>
        </div>
      </div>
      {recommended.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Recomendados para ti</h2>
          <p className="mt-0.5 text-sm text-gray-500">Cerca de ti y populares en la comunidad.</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
            {recommended.map((space) => (
              <div key={space.id} className="w-72 flex-none">
                <SpaceCard space={space} isSelected={false} onSelect={() => {}} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Explora espacios</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar espacios, barrios o lugares..."
              className="min-w-[220px] flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            />
            <SortDropdown value={sort} onChange={setSort} />
          </div>

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
                  isSelected={false}
                  onSelect={() => router.push(`/spaces/${space.slug}`)}
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

        <aside className="flex flex-col gap-4"></aside>
      </div>
    </div>
  )
}
