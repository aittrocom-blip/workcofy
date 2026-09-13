'use client'

import { useState } from 'react'
import { createPartnerPromotion, updatePartnerSocials, validateBenefitCode } from './actions'

function CodeValidator() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [resultMessage, setResultMessage] = useState('')

  async function validate() {
    if (!code.trim()) return
    setStatus('checking')
    try {
      const { benefitLabel } = await validateBenefitCode(code)
      setResultMessage(`Válido: ${benefitLabel}`)
      setStatus('ok')
      setCode('')
    } catch (e) {
      setResultMessage(e instanceof Error ? e.message : 'No se pudo validar el código.')
      setStatus('error')
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Validar código de beneficio</p>
      <p className="mt-1 text-xs text-gray-500">El código de 6 dígitos que el miembro te muestra al hacer check-in.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setStatus('idle')
          }}
          onKeyDown={(e) => e.key === 'Enter' && validate()}
          inputMode="numeric"
          placeholder="000000"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-center text-lg font-bold tracking-[0.3em]"
        />
        <button
          onClick={validate}
          disabled={status === 'checking' || code.length !== 6}
          className="flex-none rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          {status === 'checking' ? '...' : 'Validar'}
        </button>
      </div>
      {resultMessage && (
        <p className={`mt-3 text-sm font-semibold ${status === 'ok' ? 'text-workcofy-green' : 'text-red-600'}`}>
          {status === 'ok' ? '✓ ' : '✕ '}
          {resultMessage}
        </p>
      )}
    </section>
  )
}

export function PartnerDashboard({ space }: { space: any }) {
  const [instagram, setInstagram] = useState(space.instagram_url ?? '')
  const [tiktok, setTiktok] = useState(space.tiktok_url ?? '')
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [message, setMessage] = useState('')
  async function saveSocials() { try { await updatePartnerSocials(space.id, instagram, tiktok); setMessage('Redes guardadas.') } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo guardar') } }
  async function publish() { try { await createPartnerPromotion(space.id, title, description); setTitle(''); setDescription(''); setMessage('Promoción publicada.'); location.reload() } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo publicar') } }
  return <div className="mt-8 space-y-5">
    <CodeValidator />
    <section className="rounded-3xl border border-gray-200 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Redes sociales</p><div className="mt-4 grid gap-3"><input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram https://…" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="TikTok https://…" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></div><button onClick={saveSocials} className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">Guardar redes</button></section>
    <section className="rounded-3xl border border-gray-200 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Promociones</p><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Americano + sandwich" className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Condiciones y precio especial" className="mt-3 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><button onClick={publish} className="mt-3 rounded-full bg-workcofy-yellow px-4 py-2 text-sm font-bold text-black">Publicar promoción</button></section>
    {message && <p className="text-sm font-semibold text-gray-600">{message}</p>}
  </div>
}
