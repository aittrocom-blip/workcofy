'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { RewardsBadge } from '@/components/layout/RewardsBadge'

interface HeaderAuthLinksProps {
  variant?: 'desktop' | 'mobile'
}

export function HeaderAuthLinks({ variant = 'desktop' }: HeaderAuthLinksProps) {
  const router = useRouter()
  const { user, loading, signOut } = useAuthUser()
  const isDesktop = variant === 'desktop'

  if (loading) {
    return isDesktop ? <div className="hidden h-9 w-32 sm:block" /> : null
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className={isDesktop ? 'hidden items-center gap-3 sm:flex' : 'flex flex-col gap-1'}>
        <div className={isDesktop ? 'contents' : 'px-2 py-1'}>
          <RewardsBadge />
        </div>
        <Link
          href="/favoritos"
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          }
        >
          Favoritos
        </Link>
        <Link
          href="/perfil"
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          }
        >
          Perfil
        </Link>
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
