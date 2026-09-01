'use client'

import { useState, type FormEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import { ALL_COUNTRIES } from '@/lib/allCountries'
import { avatarFor } from '@/lib/avatars'
import { AvatarPickerModal } from '@/components/account/AvatarPickerModal'

interface ProfileFormProps {
  userId: string
  email: string
  initialName: string
  initialCountry: string
  initialCity: string
  initialMarketingConsent: boolean
  initialAvatarId: string | null
  joinedAt: string | null
}

function PencilIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.9 3.4 3.7 3.7M4 20l4.2-1 11.5-11.5a2.6 2.6 0 0 0-3.7-3.7L4.5 15.3 4 20Z" /></svg>
}

export function ProfileForm({ userId, email, initialName, initialCountry, initialCity, initialMarketingConsent, initialAvatarId, joinedAt }: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [country, setCountry] = useState(initialCountry)
  const [city, setCity] = useState(initialCity)
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent)
  const [avatarId, setAvatarId] = useState(initialAvatarId)
  const [editing, setEditing] = useState(false)
  const [pickingAvatar, setPickingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const avatar = avatarFor(avatarId)
  const joinedLabel = joinedAt ? new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(joinedAt)) : null

  function cancelEditing() {
    setName(initialName); setCountry(initialCountry); setCity(initialCity); setMarketingConsent(initialMarketingConsent)
    setEditing(false); setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.from('profiles').update({
        name, country, city, marketing_consent: marketingConsent,
        ...(marketingConsent && !initialMarketingConsent ? { marketing_consent_at: new Date().toISOString() } : {}),
      }).eq('id', userId)
      if (updateError) throw updateError
      setEditing(false)
    } catch { setError(NETWORK_ERROR_MESSAGE) } finally { setSaving(false) }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_10px_32px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-5 bg-gradient-to-br from-workcofy-yellow/25 via-workcofy-yellow/10 to-white px-5 py-6 sm:flex-row sm:items-center sm:px-7">
        <div className="relative h-20 w-20 flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar.src} alt={avatar.label} className="h-full w-full rounded-full border-4 border-white object-cover shadow-md" />
          <button type="button" onClick={() => setPickingAvatar(true)} aria-label="Cambiar avatar" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-sm hover:bg-gray-800"><PencilIcon /></button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Mi perfil</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">{name || 'Tu perfil'}</h1>
          <p className="mt-1 truncate text-sm text-gray-600">{email}</p>
          {joinedLabel && <p className="mt-1 text-xs text-gray-500">Miembro desde {joinedLabel}</p>}
        </div>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-black"><PencilIcon />Editar perfil</button>
      </div>

      {!editing ? (
        <div className="grid divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ubicación</p><p className="mt-2 text-sm font-medium text-gray-800">{[city, country].filter(Boolean).join(', ') || 'Aún no registrada'}</p></div>
          <div className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Novedades</p><p className="mt-2 text-sm font-medium text-gray-800">{marketingConsent ? 'Recibes novedades y promociones' : 'No recibes comunicaciones promocionales'}</p></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-500">Nombre<input value={name} required onChange={(event) => setName(event.target.value)} className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-black outline-none focus:border-black" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-500">Ciudad<input value={city} required onChange={(event) => setCity(event.target.value)} className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-black outline-none focus:border-black" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-500 sm:col-span-2">País<select value={country} required onChange={(event) => setCountry(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-black outline-none focus:border-black"><option value="" disabled>Selecciona tu país</option>{ALL_COUNTRIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="flex items-start gap-2 text-sm text-gray-600 sm:col-span-2"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-black" /><span>Quiero recibir novedades y promociones de Workcofy</span></label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><button type="button" onClick={cancelEditing} className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button><button type="submit" disabled={saving} className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </form>
      )}
      {pickingAvatar && <AvatarPickerModal userId={userId} onClose={() => setPickingAvatar(false)} onPicked={(id) => { setAvatarId(id); setPickingAvatar(false) }} />}
    </section>
  )
}
