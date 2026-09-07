'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLikes } from '@/components/providers/LikesProvider'

interface LikeButtonProps {
  spaceId: string
  /** Server-fetched count, from spaces.like_count — adjusted optimistically on toggle. */
  likeCount: number
  className?: string
}

// "Me gusta" — a public "people recommend this place" signal, distinct from
// FavoriteButton's private save-for-later heart. Shows the live count next
// to a thumbs-up icon.
export function LikeButton({ spaceId, likeCount, className = '' }: LikeButtonProps) {
  const pathname = usePathname()
  const { loggedIn, isLiked, toggleLike } = useLikes()
  const liked = isLiked(spaceId)
  const [optimisticCount, setOptimisticCount] = useState(likeCount)
  const colorClass = liked ? 'text-workcofy-black' : 'text-gray-500 hover:text-black'

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Inicia sesión para decir que te gusta este espacio"
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
    setOptimisticCount((count) => count + (liked ? -1 : 1))
    await toggleLike(spaceId)
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
