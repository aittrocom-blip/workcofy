'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/components/providers/FavoritesProvider'
import { showActionToast } from '@/components/layout/ActionToast'
import { FavoriteIcon } from '@/components/ui/FavoriteIcon'

interface FavoriteButtonProps {
  spaceId: string
  className?: string
}

export function FavoriteButton({ spaceId, className = '' }: FavoriteButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isFavorited, toggleFavorite } = useFavorites()
  const favorited = isFavorited(spaceId)

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para guardar este espacio"
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
          const saved = await toggleFavorite(spaceId)
          showActionToast(saved ? 'Guardado en favoritos' : 'Quitado de favoritos')
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
