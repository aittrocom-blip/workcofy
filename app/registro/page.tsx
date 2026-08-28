'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { translateAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })

      if (signUpError) {
        setError(translateAuthError(signUpError))
        return
      }
      setStatus('sent')
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setStatus((current) => (current === 'sent' ? current : 'idle'))
    }
  }

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu correo</h1>
        <p className="mt-3 text-sm text-gray-500">
          Te enviamos un link de confirmación a {email}. Ábrelo para activar tu cuenta.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
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
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {status === 'loading' ? 'Creando...' : 'Registrarme'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-black hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  )
}
