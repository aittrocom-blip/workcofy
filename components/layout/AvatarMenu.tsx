'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { avatarFor } from '@/lib/avatars'

interface AvatarMenuProps {
  avatarId: string | null
}

export function AvatarMenu({ avatarId }: AvatarMenuProps) {
  const router = useRouter()
  const { signOut } = useAuthUser()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const avatar = avatarFor(avatarId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menú de cuenta"
        className="h-11 w-11 overflow-hidden rounded-full border border-gray-200"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar.src} alt="" className="h-full w-full object-cover" />
      </button>

      {open && (
        <div className="absolute bottom-0 left-full z-40 ml-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <Link
            href="/favoritos"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Favoritos
          </Link>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Perfil
          </Link>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
