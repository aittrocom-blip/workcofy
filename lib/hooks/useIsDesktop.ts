// lib/hooks/useIsDesktop.ts
'use client'

import { useEffect, useState } from 'react'

// Matches Tailwind's `md` breakpoint (768px) — the same threshold every
// other desktop/mobile split in this codebase already uses (e.g.
// FiltersBar's `hidden md:block` / `md:hidden` pairs).
const DESKTOP_QUERY = '(min-width: 768px)'

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(mql.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}
