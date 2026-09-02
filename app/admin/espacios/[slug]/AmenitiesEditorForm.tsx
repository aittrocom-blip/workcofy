'use client'

import { useState } from 'react'
import {
  AMBIENTE_VALUES,
  AMENITY_GROUP_LABELS,
  AMENITY_LABELS,
  TIPO_ESPACIO_VALUES,
  type AmenitiesData,
  type TipoEspacioValue,
} from '@/lib/amenities/types'
import { updateAmenities } from './actions'

interface AmenitiesEditorFormProps {
  spaceId: string
  slug: string
  initialAmenities: AmenitiesData
}

type BooleanGroupKey = 'para_trabajar' | 'para_llamadas' | 'servicios'
const BOOLEAN_GROUPS: BooleanGroupKey[] = ['para_trabajar', 'para_llamadas', 'servicios']

const TRI_STATE_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: 'Sí', value: true },
  { label: 'No', value: false },
  { label: 'Desconocido', value: null },
]

function TriStateRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (next: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-2.5 text-sm">
      <span>{label}</span>
      <div className="flex gap-1">
        {TRI_STATE_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              value === option.value
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AmenitiesEditorForm({ spaceId, slug, initialAmenities }: AmenitiesEditorFormProps) {
  const [amenities, setAmenities] = useState<AmenitiesData>(initialAmenities)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setBoolean(group: BooleanGroupKey, key: string, value: boolean | null) {
    setAmenities((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value } as AmenitiesData[BooleanGroupKey],
    }))
  }

  function toggleTipoEspacio(value: TipoEspacioValue) {
    setAmenities((current) => ({
      ...current,
      tipo_espacio: current.tipo_espacio.includes(value)
        ? current.tipo_espacio.filter((item) => item !== value)
        : [...current.tipo_espacio, value],
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateAmenities(spaceId, slug, amenities)
      setSaved(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">Amenities</h2>

      {BOOLEAN_GROUPS.map((group) => (
        <div key={group} className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {AMENITY_GROUP_LABELS[group]}
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {Object.keys(amenities[group]).map((key) => (
              <TriStateRow
                key={key}
                label={AMENITY_LABELS[key] ?? key}
                value={amenities[group][key]}
                onChange={(value) => setBoolean(group, key, value)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMBIENTE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setAmenities((current) => ({
                  ...current,
                  ambiente: current.ambiente === value ? null : value,
                }))
              }
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                amenities.ambiente === value
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-black'
              }`}
            >
              {AMENITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo de espacio</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIPO_ESPACIO_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTipoEspacio(value)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                amenities.tipo_espacio.includes(value)
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-black'
              }`}
            >
              {AMENITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar amenities'}
      </button>
      {saved && <p className="mt-2 text-sm text-green-700">Guardado.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  )
}
