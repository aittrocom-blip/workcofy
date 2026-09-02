'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { districtLabel } from '@/lib/districts'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'

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
    </div>
  )
}
