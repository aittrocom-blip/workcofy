'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface HeaderAuthLinksProps {
  variant?: 'desktop' | 'mobile'
}

export function HeaderAuthLinks({ variant = 'desktop' }: HeaderAuthLinksProps) {
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

  const isDesktop = variant === 'desktop'

  if (!loaded) {
    return isDesktop ? <div className="hidden h-9 w-32 sm:block" /> : null
  }

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className={isDesktop ? 'hidden items-center gap-3 sm:flex' : 'flex flex-col gap-1'}>
        <span className={isDesktop ? 'text-sm text-gray-600' : 'px-2 py-2 text-sm text-gray-600'}>
          {user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-black'
          }
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className={isDesktop ? 'contents' : 'flex flex-col gap-1'}>
      <Link
        href="/login"
        className={
          isDesktop
            ? 'hidden px-2 text-sm font-semibold text-gray-500 hover:text-black sm:inline-flex sm:items-center'
            : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
        }
      >
        Ingresa
      </Link>
      <Link
        href="/registro"
        className={
          isDesktop
            ? 'hidden items-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-black hover:text-black sm:inline-flex'
            : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
        }
      >
        Regístrate
      </Link>
    </div>
  )
}
