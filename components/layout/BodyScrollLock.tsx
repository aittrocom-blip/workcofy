'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isEspaciosMapRoute } from '@/lib/espaciosMapRoute'

// /espacios is viewport-locked by design — the full-screen map fills exactly
// the space under the header, and only the space ficha's own side panel is
// meant to scroll. This is a belt-and-suspenders lock on top of that sizing
// being correct: it rules out any leftover page-level scrollbar from a
// sub-pixel rounding difference (browser zoom, font rendering, etc.).
export function BodyScrollLock() {
  const pathname = usePathname()
  const locked = isEspaciosMapRoute(pathname)

  useEffect(() => {
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [locked])

  return null
}
