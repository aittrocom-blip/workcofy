import Link from 'next/link'
import { BellIcon } from '@/components/layout/DiscoverIcons'
import { FavoriteIcon } from '@/components/ui/FavoriteIcon'

export function FavoritesShortcut() {
  return (
    <Link href="/favoritos" aria-label="Favoritos" title="Favoritos" className="flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-95">
      <span aria-hidden="true" className="h-5 w-5"><FavoriteIcon filled={false} /></span>
    </Link>
  )
}

// The notification centre does not exist yet. Keep its place in the header
// so the control is familiar when real announcements ship.
export function NotificationsShortcut() {
  return (
    <span aria-label="Notificaciones próximamente" title="Notificaciones próximamente" className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-black/70">
      <BellIcon className="h-5 w-5" />
    </span>
  )
}
