'use client'

import { useState } from 'react'
import { updateTrustProfile } from './actions'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

const LEVELS: { value: NonNullable<SpaceRecord['trust_level']>; label: string }[] = [
  { value: 'listed', label: 'Listado' },
  { value: 'community_recommended', label: 'Recomendado por la comunidad' },
  { value: 'workcofy_verified', label: 'Verificado por Workcofy' },
  { value: 'workcofy_point', label: 'Workcofy Point' },
]
const USES = ['Trabajo rápido', 'Concentración', 'Videollamadas', 'Reunión informal', 'Trabajo social', 'Lectura / estudio']

export function TrustProfileForm({ spaceId, slug, initialLevel, initialUses, initialMethod }: {
  spaceId: string; slug: string; initialLevel: NonNullable<SpaceRecord['trust_level']>; initialUses: string[]; initialMethod: string | null
}) {
  const [level, setLevel] = useState(initialLevel)
  const [uses, setUses] = useState(initialUses)
  const [method, setMethod] = useState(initialMethod ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  function toggle(use: string) { setUses((current) => current.includes(use) ? current.filter((item) => item !== use) : [...current, use]) }
  async function save() { setState('saving'); try { await updateTrustProfile(spaceId, slug, level, uses, method || null); setState('saved') } catch { setState('error') } }
  return <section className="mt-8 border-t border-gray-100 pt-8">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Confianza y ocasión de uso</h2>
    <label className="mt-4 block text-xs font-semibold text-gray-500">Nivel de confianza<select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">{LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label className="mt-4 block text-xs font-semibold text-gray-500">Método o nota breve<input value={method} onChange={(event) => setMethod(event.target.value)} placeholder="Ej. visita presencial, check-ins, llamada" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></label>
    <p className="mt-4 text-xs font-semibold text-gray-500">Bueno para</p>
    <div className="mt-2 flex flex-wrap gap-1.5">{USES.map((use) => <button key={use} type="button" onClick={() => toggle(use)} className={`rounded-full px-3 py-2 text-xs font-semibold ${uses.includes(use) ? 'bg-black text-white' : 'border border-gray-200 text-gray-600'}`}>{use}</button>)}</div>
    <button type="button" onClick={save} disabled={state === 'saving'} className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{state === 'saving' ? 'Guardando...' : 'Guardar perfil de confianza'}</button>
    {state === 'saved' && <p className="mt-2 text-sm text-green-700">Guardado.</p>}{state === 'error' && <p className="mt-2 text-sm text-red-600">No se pudo guardar.</p>}
  </section>
}
