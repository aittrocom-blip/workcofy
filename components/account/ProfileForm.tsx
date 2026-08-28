'use client'

import { useState, type FormEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import { ALL_COUNTRIES } from '@/lib/allCountries'

interface ProfileFormProps {
  initialName: string
  initialCountry: string
  initialCity: string
  initialMarketingConsent: boolean
}

export function ProfileForm({
  initialName,
  initialCountry,
  initialCity,
  initialMarketingConsent,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [country, setCountry] = useState(initialCountry)
  const [city, setCity] = useState(initialCity)
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const wasConsenting = initialMarketingConsent
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          country,
          city,
          marketing_consent: marketingConsent,
          // Only stamp a new consent timestamp on an actual off→on flip —
          // toggling off or leaving it unchanged shouldn't touch this.
          ...(marketingConsent && !wasConsenting ? { marketing_consent_at: new Date().toISOString() } : {}),
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      setSaved(true)
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-gray-500">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="country" className="text-xs font-medium text-gray-500">
          País
        </label>
        <select
          id="country"
          required
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        >
          <option value="" disabled>
            Selecciona tu país
          </option>
          {ALL_COUNTRIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-xs font-medium text-gray-500">
          Ciudad
        </label>
        <input
          id="city"
          type="text"
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(event) => setMarketingConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-black"
        />
        <span>Quiero recibir novedades y promociones de Workcofy</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      {saved && <p className="text-sm text-green-700">Guardado.</p>}
    </form>
  )
}
