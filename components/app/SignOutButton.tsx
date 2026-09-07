'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'

export function SignOutButton() {
  const router = useRouter()
  const { signOut } = useAuthUser()
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-60"
    >
      {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  )
}
