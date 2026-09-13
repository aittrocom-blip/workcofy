'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlaylistLikes } from '@/components/providers/PlaylistLikesProvider'
import { showActionToast } from '@/components/layout/ActionToast'

interface PlaylistLikeButtonProps {
  playlistId: string
  /** Server-fetched count, from playlist_stats.like_count — adjusted optimistically on toggle. */
  likeCount: number
  className?: string
}

// "Me gusta" on a Spotify playlist card — a public "people like this" signal,
// same shape as space/LikeButton.
export function PlaylistLikeButton({ playlistId, likeCount, className = '' }: PlaylistLikeButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isLiked, toggleLike } = usePlaylistLikes()
  const liked = isLiked(playlistId)
  const [optimisticCount, setOptimisticCount] = useState(likeCount)
  const colorClass = liked ? 'text-workcofy-black' : 'text-gray-500 hover:text-black'

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para decir que te gusta esta playlist"
        title="Inicia sesión para dar Me gusta"
        className={`${className} text-gray-500 hover:text-black`}
      >
        <ThumbsUpIcon filled={false} />
        {optimisticCount > 0 && <span className="text-sm font-semibold">{optimisticCount}</span>}
      </Link>
    )
  }

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    const previous = optimisticCount
    setOptimisticCount((count) => count + (liked ? -1 : 1))
    try {
      const nowLiked = await toggleLike(playlistId)
      showActionToast(nowLiked ? 'Gracias por tu me gusta' : 'Me gusta retirado')
    } catch {
      setOptimisticCount(previous)
      showActionToast('No se pudo guardar. Inténtalo otra vez.')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? 'Quitar Me gusta' : 'Me gusta'}
      aria-pressed={liked}
      className={`${className} ${colorClass}`}
    >
      <ThumbsUpIcon filled={liked} />
      {optimisticCount > 0 && <span className="text-sm font-semibold">{optimisticCount}</span>}
    </button>
  )
}

function ThumbsUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 flex-none"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 10v11H4a1 1 0 01-1-1v-9a1 1 0 011-1h3zm0 0l4.5-7.5A1.5 1.5 0 0113 3.5V8h5.5a2 2 0 011.94 2.5l-1.7 8A2 2 0 0116.8 20H7"
      />
    </svg>
  )
}
