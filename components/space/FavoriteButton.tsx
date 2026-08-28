'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/components/providers/FavoritesProvider'

interface FavoriteButtonProps {
  spaceId: string
  className?: string
}

export function FavoriteButton({ spaceId, className = '' }: FavoriteButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isFavorited, toggleFavorite } = useFavorites()
  const favorited = isFavorited(spaceId)
  // `className` (passed by each caller) only ever sets layout/position/
  // background — color lives here so favorited vs. not never has two
  // Tailwind color utilities competing on the same element.
  const colorClass = favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para guardar este espacio"
        title="Inicia sesión para guardar"
        className={`${className} text-gray-400 hover:text-red-500`}
      >
        <HeartIcon filled={false} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        toggleFavorite(spaceId)
      }}
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={favorited}
      className={`${className} ${colorClass}`}
    >
      <HeartIcon filled={favorited} />
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-full w-full"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z"
      />
    </svg>
  )
}
