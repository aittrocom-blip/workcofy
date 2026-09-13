'use client'

import { useEffect, useState } from 'react'
import { createPartnerAccess, disablePartnerAccess, resetPartnerPassword } from './actions'

export function PartnerAccessForm({ spaceId, slug, partner }: { spaceId: string; slug: string; partner: { username: string; active: boolean } | null }) {
  const [result, setResult] = useState<{ username: string; password: string } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [copied, setCopied] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  async function submit() {
    setBusy(true); setError('')
    try { setResult(await createPartnerAccess(spaceId, slug)) }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear el acceso') }
    finally { setBusy(false) }
  }

  async function disable() {
    if (!window.confirm('¿Deshabilitar el acceso Partner de este local?')) return
    setBusy(true); setError('')
    try { await disablePartnerAccess(spaceId, slug); setDisabled(true) }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo deshabilitar el acceso') }
    finally { setBusy(false) }
  }

  async function resetPassword() {
    setBusy(true); setError(''); setNewPassword('')
    try { const result = await resetPartnerPassword(spaceId, slug); setNewPassword(result.password) }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo generar la nueva clave') }
    finally { setBusy(false) }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  function getPortalUrl() { return `${window.location.origin}/partner` }

  function visiblePassword() { return newPassword || result?.password || '' }

  async function shareAccess() {
    const password = visiblePassword()
    const text = `Acceso Workcofy Partner\nUsuario: ${partner?.username ?? result?.username ?? ''}\nClave temporal: ${password}\nEnlace: ${getPortalUrl()}`
    if (navigator.share) await navigator.share({ title: 'Acceso Workcofy Partner', text })
    else await copy(text, 'acceso')
  }

  if (!mounted) return null

  return <section className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-5">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Acceso Partner</p>
    <h2 className="mt-1 text-lg font-extrabold">Panel limitado para el local</h2>
    <p className="mt-2 text-sm leading-relaxed text-gray-600">El partner podrá actualizar sus redes y promociones, y consultar escaneos. La ficha de Google Maps, reseñas, horarios y datos protegidos permanecen bajo control de Workcofy.</p>
    {partner && <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm"><div className="flex items-center justify-between gap-3"><p className="font-bold">Acceso creado</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${partner.active && !disabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{partner.active && !disabled ? 'Activo' : 'Deshabilitado'}</span></div><p className="mt-3 text-gray-600">Usuario: <code className="font-semibold text-gray-900">{partner.username}</code></p>{newPassword && <p className="mt-2 rounded-xl bg-workcofy-yellow/20 px-3 py-2 font-semibold">Nueva clave temporal: <code>{newPassword}</code></p>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => copy(partner.username, 'usuario')} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold">Copiar usuario</button><button type="button" onClick={() => copy(getPortalUrl(), 'enlace')} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold">Copiar enlace</button><button type="button" onClick={() => copy(visiblePassword(), 'clave')} disabled={!visiblePassword()} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Copiar clave</button><button type="button" onClick={shareAccess} disabled={!visiblePassword()} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Compartir acceso</button><button type="button" onClick={resetPassword} disabled={busy || !partner.active} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Generar nueva clave</button></div>{copied && <p className="mt-2 text-xs font-semibold text-green-700">{copied === 'usuario' ? 'Usuario copiado.' : copied === 'enlace' ? 'Enlace copiado.' : copied === 'clave' ? 'Clave copiada.' : 'Acceso copiado.'}</p>}<p className="mt-3 text-xs text-gray-500">La clave solo se muestra al crearla o regenerarla. La anterior deja de funcionar.</p></div>}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={submit} disabled={busy || disabled || Boolean(partner?.active)} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}{busy ? 'Procesando…' : partner?.active ? 'Acceso activo' : '+ Activar acceso Partner'}</button><button type="button" onClick={disable} disabled={busy || disabled || !partner?.active} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">{busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-700" aria-hidden="true" />}Deshabilitar acceso</button></div>
    {result && <div className="mt-4 rounded-2xl border border-workcofy-yellow bg-workcofy-yellow/20 p-4 text-sm"><p className="font-bold">Guarda estas credenciales ahora</p><p className="mt-2">Usuario: <code>{result.username}</code></p><p>Clave temporal: <code>{result.password}</code></p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => copy(`Usuario: ${result.username}\nClave: ${result.password}\nEnlace: ${getPortalUrl()}`, 'acceso')} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold">Copiar acceso</button><button type="button" onClick={shareAccess} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold">Compartir acceso</button></div><p className="mt-2 text-xs text-gray-600">Acceso: /partner · La clave debe cambiarse en la primera entrada.</p></div>}
    {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
  </section>
}
