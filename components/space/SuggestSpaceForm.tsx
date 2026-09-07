'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { COUNTRY_OPTIONS } from '@/lib/countries'

// Mirrors ReviewsSection's login-gate pattern: check the session once on
// mount, show a "Inicia sesión" prompt if there isn't one, render the real
// form otherwise.
export function SuggestSpaceForm() {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setAuthLoaded(true)
    })
  }, [])

  if (!authLoaded) return null

  if (!userId) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="font-semibold text-black hover:underline"
        >
          Inicia sesión
        </Link>{' '}
        para sugerir un local.
      </p>
    )
  }

  return <Form userId={userId} />
}

function Form({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0].value)
  const [country, setCountry] = useState<string>(COUNTRY_OPTIONS[0].value)
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: insertError } = await supabase.from('space_suggestions').insert({
        user_id: userId,
        name: name.trim(),
        category,
        country,
        district: district.trim(),
        address: address.trim() || null,
        notes: notes.trim() || null,
      })
      if (insertError) throw insertError
      setSent(true)
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setSaving(false)
    }
  }

  if (sent) {
    return (
      <p className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium">
        ¡Gracias! Vamos a revisar tu sugerencia.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Nombre del local *</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Ej: Neira Café Lab"
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Categoría *</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">País *</span>
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Zona / distrito *</span>
        <input
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          required
          placeholder="Ej: Miraflores, Providencia..."
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Dirección</span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Opcional"
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">¿Por qué deberíamos agregarlo?</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Opcional"
          className="resize-none rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Enviando...' : 'Enviar sugerencia'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
