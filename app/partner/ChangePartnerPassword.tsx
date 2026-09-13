'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { completePartnerPasswordChange } from './actions'

export function ChangePartnerPassword() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    if (password.length < 8) return setError('La nueva clave debe tener al menos 8 caracteres.')
    if (password !== confirmation) return setError('Las claves no coinciden.')
    setSaving(true)
    try { const { error: authError } = await createBrowserSupabaseClient().auth.updateUser({ password }); if (authError) throw authError; await completePartnerPasswordChange(); setDone(true) }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar la clave') }
    finally { setSaving(false) }
  }
  if (done) return <section className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-5"><h2 className="text-xl font-extrabold">Clave actualizada</h2><p className="mt-2 text-sm text-gray-600">Ya puedes usar tu panel Partner.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white">Continuar</button></section>
  return <section className="mt-8 max-w-md rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Primer ingreso</p><h2 className="mt-2 text-2xl font-extrabold">Cambia tu clave</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">Por seguridad, reemplaza la clave temporal antes de entrar al panel de tu local.</p><form onSubmit={submit} className="mt-5 space-y-3"><input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva clave" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><input required minLength={8} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Repite la nueva clave" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />{error && <p className="text-sm font-semibold text-red-600">{error}</p>}<button disabled={saving} className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar nueva clave'}</button></form></section>
}
