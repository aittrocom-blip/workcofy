'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function HeaderAuthLinks() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoaded(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Avoid a flash of the wrong state before the client resolves the session.
  if (!loaded) return <div className="hidden h-9 w-32 sm:block" />

  if (user) {
    return (
      <div className="hidden items-center gap-3 sm:flex">
        <span className="text-sm text-gray-600">{user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-semibold text-gray-500 hover:text-black"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="hidden px-2 text-sm font-semibold text-gray-500 hover:text-black sm:inline-flex">
        Ingresa
      </Link>
      <Link
        href="/registro"
        className="hidden items-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-black hover:text-black sm:inline-flex"
      >
        Regístrate
      </Link>
    </>
  )
}
