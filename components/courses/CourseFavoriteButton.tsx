'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCourseFavorites } from '@/components/providers/CourseFavoritesProvider'
import { showActionToast } from '@/components/layout/ActionToast'

interface CourseFavoriteButtonProps {
  courseId: string
  className?: string
}

// Mirrors components/space/FavoriteButton.tsx exactly, over the course
// favorites set instead of spaces.
export function CourseFavoriteButton({ courseId, className = '' }: CourseFavoriteButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isFavorited, toggleFavorite } = useCourseFavorites()
  const favorited = isFavorited(courseId)
  const colorClass = favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para guardar este curso"
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
      onClick={async (event) => {
        event.stopPropagation()
        try {
          const saved = await toggleFavorite(courseId)
          showActionToast(saved ? 'Curso guardado en favoritos' : 'Curso quitado de favoritos')
        } catch {
          showActionToast('No se pudo guardar. Inténtalo otra vez.')
        }
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
