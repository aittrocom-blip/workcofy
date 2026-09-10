'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Final fallback for the authenticated Home. The normal page already treats
// shelves as optional; this catches anything outside those requests and gives
// the member a way back instead of a blank route.
export default function ExplorarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the error available to the browser console without exposing its
    // implementation details in the product UI.
    console.error('Explorar could not render')
  }, [])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-start justify-center px-4 py-10 md:px-8">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-workcofy-yellow/20 text-xl">!</span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">No pudimos abrir Explorar</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">Revisa tu conexión y vuelve a intentarlo. Tus espacios y tu progreso seguirán aquí.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-full bg-workcofy-yellow px-5 text-sm font-bold text-black hover:bg-workcofy-yellow/80">Reintentar</button>
        <Link href="/spots" className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-5 text-sm font-semibold hover:border-black">Ver espacios</Link>
      </div>
    </main>
  )
}
