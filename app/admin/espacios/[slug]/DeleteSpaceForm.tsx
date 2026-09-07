'use client'

import { useState } from 'react'
import { setSpaceActive } from './actions'

interface DeleteSpaceFormProps {
  spaceId: string
  slug: string
  initialActive: boolean
}

// Soft delete: "Eliminar espacio" needs a confirm step since it's a real
// (if reversible) removal from every public listing — a single misclick
// shouldn't do it. Once deactivated, this same control flips to a plain
// "Reactivar" button, no confirm needed since re-showing a space is low-risk.
export function DeleteSpaceForm({ spaceId, slug, initialActive }: DeleteSpaceFormProps) {
  const [active, setActive] = useState(initialActive)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSetActive(next: boolean) {
    setSaving(true)
    setError(null)
    try {
      await setSpaceActive(spaceId, slug, next)
      setActive(next)
      setConfirming(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!active) {
    return (
      <div className="mt-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-sm font-semibold text-red-700">Este espacio está desactivado.</p>
        <p className="mt-0.5 text-xs text-red-600">No aparece en ningún listado público.</p>
        <button
          type="button"
          onClick={() => handleSetActive(true)}
          disabled={saving}
          className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
        >
          {saving ? 'Reactivando...' : 'Reactivar'}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-4">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">¿Seguro? Se ocultará de todos los listados públicos.</span>
          <button
            type="button"
            onClick={() => handleSetActive(false)}
            disabled={saving}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-black"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Eliminar espacio
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
