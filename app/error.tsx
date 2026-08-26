'use client'

import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
      <h1 className="text-2xl font-bold md:text-3xl">Algo salió mal</h1>
      <p className="mt-3 text-gray-600">
        No pudimos cargar los espacios en este momento. Vuelve a intentarlo en unos segundos.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-block rounded-full bg-black px-5 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  )
}
