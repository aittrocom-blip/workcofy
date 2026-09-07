'use client'

import { useEffect, useRef, useState } from 'react'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { CategoryIcon } from '@/components/discovery/CategoryIcon'

interface CategoryFilterDropdownProps {
  selected: string[]
  onChange: (categories: string[]) => void
}

// Consolidates what used to be a row of one pill per space type into a
// single "Espacio" dropdown — a multi-select checklist instead of always
// showing every type at once. Empty selection means "todos".
export function CategoryFilterDropdown({ selected, onChange }: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = selected.length > 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggleCategory(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex h-[42px] flex-none items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
          active ? 'bg-black text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-black hover:text-black'
        }`}
      >
        <CategoryIcon name="todos" className="h-5 w-5" active={active} />
        Espacio
        {active && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[11px] font-bold">
            {selected.length}
          </span>
        )}
        <CaretIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <CheckRow label="Todos" checked={!active} onClick={() => onChange([])} icon={<CategoryIcon name="todos" className="h-4 w-4" />} />
          <div className="my-1 border-t border-gray-100" />
          {CATEGORY_OPTIONS.filter((option) => option.active).map((option) => (
            <CheckRow
              key={option.value}
              label={option.label}
              checked={selected.includes(option.value)}
              onClick={() => toggleCategory(option.value)}
              icon={<CategoryIcon name={option.value} className="h-4 w-4" />}
            />
          ))}
          {CATEGORY_OPTIONS.filter((option) => !option.active).map((option) => (
            <div
              key={option.value}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-300"
            >
              <CategoryIcon name={option.value} className="h-4 w-4 opacity-40" />
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onClick,
  icon,
}: {
  label: string
  checked: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
    >
      <span
        className={`flex h-4 w-4 flex-none items-center justify-center rounded border-2 ${
          checked ? 'border-black bg-black' : 'border-gray-300'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {icon}
      {label}
    </button>
  )
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
