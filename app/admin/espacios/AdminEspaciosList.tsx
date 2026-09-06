'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { districtLabel } from '@/lib/districts'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface AdminEspaciosListProps {
  spaces: SpaceRecord[]
}

type StatusFilter = 'all' | 'verified' | 'unverified'

export function AdminEspaciosList({ spaces }: AdminEspaciosListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return spaces.filter((space) => {
      if (status === 'verified' && !space.verified) return false
      if (status === 'unverified' && space.verified) return false
      if (term) {
        const haystack = `${space.name} ${districtLabel(space.district)}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [spaces, search, status])

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o distrito..."
          className="min-w-[220px] flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-black"
        />
        {(
          [
            { value: 'all', label: 'Todos' },
            { value: 'verified', label: 'Verificados' },
            { value: 'unverified', label: 'Sin verificar' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              status === option.value
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400">{filtered.length} de {spaces.length} espacios</p>

      <ul className="mt-3 flex flex-col gap-2">
        {filtered.map((space) => (
          <li key={space.id}>
            <Link
              href={`/admin/espacios/${space.slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm hover:border-black"
            >
              <span>
                {space.name}
                <span className="ml-2 text-gray-400">{districtLabel(space.district)}</span>
              </span>
              <span
                className={
                  space.verified
                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500'
                }
              >
                {space.verified ? 'Verificado' : 'Sin verificar'}
              </span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No hay espacios con estos filtros.</p>
        )}
      </ul>
    </>
  )
}
