'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function PartnerLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try { const email = username.includes('@') ? username : `${username}@partners.workcofy.local`; const { error: signInError } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password }); if (signInError) throw signInError; router.replace('/partner'); router.refresh() }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo ingresar') }
    finally { setLoading(false) }
  }
  return <form onSubmit={submit} className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><label className="text-xs font-semibold text-gray-500">Usuario Partner</label><input required value={username} onChange={e => setUsername(e.target.value)} placeholder="partner-nombre-del-local" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-black" /><label className="mt-4 block text-xs font-semibold text-gray-500">Contraseña</label><input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-black" />{error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}<button disabled={loading} className="mt-5 flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />Ingresando…</span> : 'Ingresar a mi local'}</button><p className="mt-4 text-center text-xs text-gray-400">¿No tienes acceso? Solicítalo directamente a Workcofy.</p></form>
}
