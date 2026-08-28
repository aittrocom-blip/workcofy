'use client'

import { useState, type MouseEvent } from 'react'

interface ShareButtonProps {
  spaceName: string
  slug: string
  className?: string
}

export function ShareButton({ spaceName, slug, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare(event: MouseEvent) {
    event.stopPropagation()
    const url = `${window.location.origin}/spaces/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({ title: spaceName, url })
      } catch {
        // User closed the native share sheet without picking anything —
        // not an error worth surfacing.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied or unavailable — nothing more to do here.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copiado' : 'Compartir espacio'}
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
