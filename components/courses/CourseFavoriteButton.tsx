'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCourseFavorites } from '@/components/providers/CourseFavoritesProvider'
import { showActionToast } from '@/components/layout/ActionToast'
import { FavoriteIcon } from '@/components/ui/FavoriteIcon'

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

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para guardar este curso"
        title="Inicia sesión para guardar"
        className={className}
      >
        <FavoriteIcon filled={false} />
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
      className={className}
    >
      <FavoriteIcon filled={favorited} />
    </button>
  )
}
