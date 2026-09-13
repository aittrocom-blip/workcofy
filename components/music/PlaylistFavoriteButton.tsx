'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlaylistFavorites, type PlaylistFavoriteMeta } from '@/components/providers/PlaylistFavoritesProvider'
import { showActionToast } from '@/components/layout/ActionToast'
import { FavoriteIcon } from '@/components/ui/FavoriteIcon'

interface PlaylistFavoriteButtonProps {
  playlist: PlaylistFavoriteMeta
  className?: string
}

// Saves a Spotify playlist for later — private, no visible count, same
// shape as space/FavoriteButton. Takes the full playlist (not just its id)
// because playlist_favorites denormalizes name/image/owner/category at
// save time for /favoritos to render (see migration 0033).
export function PlaylistFavoriteButton({ playlist, className = '' }: PlaylistFavoriteButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isFavorited, toggleFavorite } = usePlaylistFavorites()
  const favorited = isFavorited(playlist.id)

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para guardar esta playlist"
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
          const saved = await toggleFavorite(playlist)
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
