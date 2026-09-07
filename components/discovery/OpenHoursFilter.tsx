'use client'

import { useEffect, useRef, useState } from 'react'
import type { DiscoveryFilterState } from '@/lib/filters/discoveryFilters'

interface OpenHoursFilterProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  /** 'chip' matches the category-chip look (icon + text-sm, same sizing as Todos/Café/...) for bars that place this alongside those chips. */
  variant?: 'default' | 'chip'
}

type HorarioMode = 'any' | 'now' | '24h' | 'between'

function modeFromFilters(filters: DiscoveryFilterState): HorarioMode {
  if (filters.openBetween) return 'between'
  if (filters.open24h) return '24h'
  if (filters.openNow) return 'now'
  return 'any'
}

const DEFAULT_START = '09:00'
const DEFAULT_END = '18:00'
const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

function TimeGrid({
  label,
  value,
  onPick,
}: {
  label: string
  value: string
  onPick: (time: string) => void
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold text-gray-500">{label}</p>
      <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto pr-1">
        {HOURS.map((hour) => (
          <button
            key={hour}
            type="button"
            onClick={() => onPick(hour)}
            className={`rounded-lg px-2 py-1 text-left text-xs transition-colors ${
              hour === value ? 'bg-black font-semibold text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {hour}
          </button>
        ))}
      </div>
    </div>
  )
}

// "Horario" dropdown: cualquier horario / abierto ahora / abierto 24 horas /
// horario de apertura (dos grillas de horas, siempre evaluado contra hoy —
// sin selector de día, ver design note). Each pick applies immediately,
// matching every other filter in this bar (no separate "Aplicar" step).
export function OpenHoursFilter({ filters, onChange, variant = 'default' }: OpenHoursFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mode = modeFromFilters(filters)
  const [draftStart, setDraftStart] = useState(filters.openBetween?.start ?? DEFAULT_START)
  const [draftEnd, setDraftEnd] = useState(filters.openBetween?.end ?? DEFAULT_END)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectMode(next: HorarioMode) {
    if (next === 'any') onChange({ openNow: false, open24h: false, openBetween: null })
    else if (next === 'now') onChange({ openNow: true, open24h: false, openBetween: null })
    else if (next === '24h') onChange({ openNow: false, open24h: true, openBetween: null })
    else onChange({ openNow: false, open24h: false, openBetween: { start: draftStart, end: draftEnd } })
    if (next !== 'between') setOpen(false)
  }

  function pickStart(time: string) {
    setDraftStart(time)
    onChange({ openNow: false, open24h: false, openBetween: { start: time, end: draftEnd } })
  }

  function pickEnd(time: string) {
    setDraftEnd(time)
    onChange({ openNow: false, open24h: false, openBetween: { start: draftStart, end: time } })
  }

  const label = mode === 'now' ? 'Abierto ahora' : mode === '24h' ? 'Abierto 24h' : mode === 'between' ? `${draftStart}–${draftEnd}` : 'Horario'
  const active = mode !== 'any'

  const trigger =
    variant === 'chip'
      ? // Icon-only in the map overlay — a label + caret took more room than
        // this filter earns in that compact row; the same dropdown opens on
        // click regardless.
        `flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full transition-all ${
          active ? 'bg-black shadow-sm' : 'border border-gray-200 bg-white shadow-sm hover:border-black'
        }`
      : `flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold shadow-sm transition-all ${
          active ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black'
        }`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={variant === 'chip' ? `Horario: ${label}` : undefined}
        title={variant === 'chip' ? label : undefined}
        className={trigger}
      >
        <ClockIcon active={active} chip={variant === 'chip'} />
        {variant !== 'chip' && (
          <>
            {label}
            <CaretIcon open={open} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <RadioRow label="Cualquier horario" checked={mode === 'any'} onClick={() => selectMode('any')} />
          <RadioRow label="Abierto ahora" checked={mode === 'now'} onClick={() => selectMode('now')} />
          <RadioRow label="Abierto 24 horas" checked={mode === '24h'} onClick={() => selectMode('24h')} />
          <RadioRow label="Horario de apertura" checked={mode === 'between'} onClick={() => selectMode('between')} />

          {mode === 'between' && (
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <TimeGrid label="Abre" value={draftStart} onPick={pickStart} />
              <TimeGrid label="Cierra" value={draftEnd} onPick={pickEnd} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RadioRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
    >
      <span
        className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
          checked ? 'border-black' : 'border-gray-300'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-black" />}
      </span>
      {label}
    </button>
  )
}

function ClockIcon({ active, chip }: { active: boolean; chip: boolean }) {
  if (chip) {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? 'text-green-400' : 'text-gray-700'}`} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    )
  }
  return <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
}

function CaretIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 flex-none transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}
