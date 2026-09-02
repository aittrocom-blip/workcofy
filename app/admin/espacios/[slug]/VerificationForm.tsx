'use client'

import { useState } from 'react'
import { AMENITY_KEYS, AMENITY_LABELS } from '@/lib/amenities/types'
import { updateVerification } from './actions'

interface VerificationFormProps {
  spaceId: string
  slug: string
  initialVerified: boolean
  initialVerifiedAmenities: string[]
}

export function VerificationForm({
  spaceId,
  slug,
  initialVerified,
  initialVerifiedAmenities,
}: VerificationFormProps) {
  const [verified, setVerified] = useState(initialVerified)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialVerifiedAmenities)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAmenity(key: string) {
    setSelectedAmenities((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateVerification(spaceId, slug, verified, selectedAmenities)
      setSaved(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
        {AMENITY_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
          >
            {AMENITY_LABELS[key] ?? key}
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
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  )
}
