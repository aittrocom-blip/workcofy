'use client'

import { useState } from 'react'
import { updateVerification } from './actions'

interface VerificationFormProps {
  spaceId: string
  slug: string
  initialVerified: boolean
}

// The "Workcofy Verified" flag alone — which amenities back it up lives in
// AmenitiesEditorForm below (verified_amenities is derived from whatever's
// marked "Sí" there), so this form doesn't repeat that checklist.
export function VerificationForm({ spaceId, slug, initialVerified }: VerificationFormProps) {
  const [verified, setVerified] = useState(initialVerified)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateVerification(spaceId, slug, verified)
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

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {saved && <p className="mt-2 text-sm text-green-700">Guardado.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  )
}
