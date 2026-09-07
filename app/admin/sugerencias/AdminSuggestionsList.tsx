'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { districtLabel } from '@/lib/districts'
import { countryLabel } from '@/lib/countries'
import { optionLabel } from '@/lib/optionLabel'
import type { SpaceSuggestionRecord, SpaceSuggestionStatus } from '@/lib/data/spaceSuggestions'
import { approveSuggestion, rejectSuggestion } from './actions'

interface AdminSuggestionsListProps {
  suggestions: SpaceSuggestionRecord[]
}

type StatusFilter = SpaceSuggestionStatus | 'all'

const STATUS_LABEL: Record<SpaceSuggestionStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_BADGE: Record<SpaceSuggestionStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export function AdminSuggestionsList({ suggestions }: AdminSuggestionsListProps) {
  const [status, setStatus] = useState<StatusFilter>('pending')

  const filtered = useMemo(
    () => (status === 'all' ? suggestions : suggestions.filter((s) => s.status === status)),
    [suggestions, status]
  )

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            { value: 'pending', label: 'Pendientes' },
            { value: 'approved', label: 'Aprobadas' },
            { value: 'rejected', label: 'Rechazadas' },
            { value: 'all', label: 'Todas' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              status === option.value
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {filtered.map((suggestion) => (
          <SuggestionRow key={suggestion.id} suggestion={suggestion} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No hay sugerencias con este filtro.</p>
        )}
      </ul>
    </>
  )
}

function SuggestionRow({ suggestion }: { suggestion: SpaceSuggestionRecord }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setBusy(true)
    setError(null)
    try {
      await approveSuggestion(suggestion.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el espacio.')
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    setError(null)
    try {
      await rejectSuggestion(suggestion.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descartar.')
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-gray-100 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{suggestion.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {optionLabel(CATEGORY_OPTIONS, suggestion.category) ?? suggestion.category} ·{' '}
            {districtLabel(suggestion.district)} · {countryLabel(suggestion.country)}
          </p>
          {suggestion.address && <p className="mt-1 text-xs text-gray-500">{suggestion.address}</p>}
          {suggestion.notes && <p className="mt-1.5 text-gray-600">{suggestion.notes}</p>}
          <p className="mt-1.5 text-xs text-gray-400">
            Sugerido por {suggestion.submitterName ?? 'un usuario'}
          </p>
        </div>
        <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[suggestion.status]}`}>
          {STATUS_LABEL[suggestion.status]}
        </span>
      </div>

      {suggestion.status === 'pending' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
          >
            {busy ? 'Agregando...' : 'Agregar espacio'}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={busy}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-black disabled:opacity-50"
          >
            Descartar
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  )
}
