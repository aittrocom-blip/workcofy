'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { translateAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer`,
      })

      if (resetError) {
        setError(translateAuthError(resetError))
        setStatus('idle')
        return
      }
      setStatus('sent')
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu correo</h1>
        <p className="mt-3 text-sm text-gray-500">
          Si existe una cuenta con {email}, te enviamos un link para elegir una nueva
          contraseña.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ingresa tu correo y te mandamos un link para elegir una nueva contraseña.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-medium text-gray-500">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-black hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  )
}
