'use client'

import { useState } from 'react'

interface ProviderLogoProps {
  provider: string
  /** The course's own URL — its domain is what the logo is looked up by. */
  courseUrl: string
  className?: string
}

// No provider_logo_url exists in the courses table, so the logo is derived
// from the course URL's domain via Google's favicon service. Falls back to
// the provider's initial (the previous look) if the image fails or the
// URL has no usable host.
export function providerLogoUrl(courseUrl: string): string | null {
  try {
    const host = new URL(courseUrl).hostname.replace(/^www\./, '')
    if (!host) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
  } catch {
    return null
  }
}

export function ProviderLogo({ provider, courseUrl, className = 'h-9 w-9' }: ProviderLogoProps) {
  const [failed, setFailed] = useState(false)
  const src = providerLogoUrl(courseUrl)

  if (!src || failed) {
    return (
      <span aria-hidden="true" className={`${className} flex flex-none items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600`}>
        {provider.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <span className={`${className} flex flex-none items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
    </span>
  )
}
