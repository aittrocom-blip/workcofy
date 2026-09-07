'use client'

import { useState, type MouseEvent } from 'react'
import { track } from '@vercel/analytics'

interface ShareButtonProps {
  /** Shown in the native share sheet; not used for the clipboard fallback. */
  title: string
  /** Site-relative path to share, e.g. `/oportunidades/${slug}` — resolved against window.location.origin. */
  path: string
  /** What's being shared — recorded on the "share" Vercel Analytics event so it can be filtered/broken down there. */
  kind: 'espacio' | 'oportunidad' | 'curso'
  className?: string
}

// Generic share control: native share sheet where available, clipboard copy
// otherwise. Used by spaces, opportunities and courses alike — each just
// passes its own title/path/kind. A successful share (sheet opened, or link
// copied) fires a "share" analytics event — there's no click_count-style
// column for shares, so Vercel Analytics is the record of this, not Supabase.
export function ShareButton({ title, path, kind, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare(event: MouseEvent) {
    event.stopPropagation()
    const url = `${window.location.origin}${path}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        track('share', { kind, path })
      } catch {
        // User closed the native share sheet without picking anything —
        // not an error worth surfacing, and not a completed share to track.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      track('share', { kind, path })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied or unavailable — nothing more to do here.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copiado' : 'Compartir'}
      title={copied ? '¡Copiado!' : 'Compartir'}
      className={className}
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
    </button>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0L7 9m5-5l5 5M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
