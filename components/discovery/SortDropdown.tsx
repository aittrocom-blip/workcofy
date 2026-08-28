'use client'

import { useEffect, useRef, useState } from 'react'
import type { SortOption } from '@/lib/filters/discoveryFilters'

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

// "Mejor valorados" and "Mejor Workcofy Score" are deliberately different
// options — Google's star rating and the Workcofy Score are different
// signals (see lib/score/workcofyScore.ts), so a user might want either.
const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Más cerca' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'workcofy_score', label: 'Mejor Workcofy Score' },
  { value: 'popular', label: 'Más popular' },
]

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = OPTIONS.find((option) => option.value === value) ?? OPTIONS[1]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-none items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:border-black hover:text-black"
      >
        {current.label}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/nav-chevron-down.png"
          alt=""
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(13rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                option.value === value ? 'font-semibold text-black' : 'text-gray-600'
              }`}
            >
              {option.label}
              {option.value === value && <span className="text-workcofy-yellow">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
