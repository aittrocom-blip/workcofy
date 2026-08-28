'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { useEffect } from 'react'
import { AMENITY_LABELS } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { updateVerification } from './actions'

interface AdminSpacePageProps {
  params: { slug: string }
}

export default function AdminSpacePage({ params }: AdminSpacePageProps) {
  const [space, setSpace] = useState<SpaceRecord | null | undefined>(undefined)
  const [verified, setVerified] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/espacios/${params.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SpaceRecord | null) => {
        setSpace(data)
        if (data) {
          setVerified(data.verified)
          setSelectedAmenities(data.verified_amenities)
        }
      })
  }, [params.slug])

  if (space === null) notFound()
  if (space === undefined) {
    return <div className="mx-auto max-w-xl px-4 py-10 text-sm text-gray-500">Cargando...</div>
  }

  function toggleAmenity(key: string) {
    setSelectedAmenities((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await updateVerification(space!.id, space!.slug, verified, selectedAmenities)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm">
        Workcofy Verified
        <input
          type="checkbox"
          checked={verified}
          onChange={(event) => setVerified(event.target.checked)}
          className="h-4 w-4 accent-black"
        />
      </label>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Amenities confirmadas
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {Object.entries(AMENITY_LABELS).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
          >
            {label}
            <input
              type="checkbox"
              checked={selectedAmenities.includes(key)}
              onChange={() => toggleAmenity(key)}
              className="h-4 w-4 accent-black"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {saved && <p className="mt-2 text-sm text-green-700">Guardado.</p>}
    </div>
  )
}
