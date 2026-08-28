'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { translateAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'

export default function RestablecerPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    // The recovery link, once opened, makes the SDK parse the URL itself and
    // fire this event with a temporary recovery session — nothing here
    // needs to read the URL or exchange a code manually.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(translateAuthError(updateError))
        return
      }
      setDone(true)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Contraseña actualizada</h1>
        <p className="mt-3 text-sm text-gray-500">Te llevamos al inicio.</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Restablecer contraseña</h1>
        <p className="mt-3 text-sm text-gray-500">
          Abre esta página desde el link que te enviamos por correo.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Elige tu nueva contraseña</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-medium text-gray-500">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
