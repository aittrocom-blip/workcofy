'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { translateAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import { ALL_COUNTRIES } from '@/lib/allCountries'

const TERMS_VERSION = 'v1'

const ACQUISITION_SOURCES: { value: string; label: string }[] = [
  { value: 'google', label: 'Google / buscador' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Recomendación de un amigo' },
  { value: 'venue', label: 'Un café / hotel / coworking' },
  { value: 'ads', label: 'Publicidad' },
  { value: 'other', label: 'Otro' },
]

export default function RegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [acquisitionSource, setAcquisitionSource] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
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
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            country,
            city,
            acquisition_source: acquisitionSource,
            marketing_consent: marketingConsent,
            terms_accepted: termsAccepted,
            terms_version: TERMS_VERSION,
          },
        },
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
          <label htmlFor="name" className="text-xs font-medium text-gray-500">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
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
        <div className="flex flex-col gap-1">
          <label htmlFor="country" className="text-xs font-medium text-gray-500">
            País
          </label>
          <select
            id="country"
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="" disabled>
              Selecciona tu país
            </option>
            {ALL_COUNTRIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-xs font-medium text-gray-500">
            Ciudad
          </label>
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Tu ciudad"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="acquisitionSource" className="text-xs font-medium text-gray-500">
            ¿Cómo conociste Workcofy?
          </label>
          <select
            id="acquisitionSource"
            required
            value={acquisitionSource}
            onChange={(event) => setAcquisitionSource(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {ACQUISITION_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>
            Acepto los{' '}
            <Link href="/terminos" target="_blank" className="font-semibold text-black hover:underline">
              Términos y Condiciones
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>Quiero recibir novedades y promociones de Workcofy</span>
        </label>
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
