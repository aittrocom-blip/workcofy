// Shared favorite glyph — a pinned-note mark instead of a heart, used by
// every favorite/save toggle (spaces, courses, playlists) and the navbar
// shortcut, so "favorito" reads as one consistent icon across the app.
export function FavoriteIcon({ filled, className = 'h-full w-full' }: { filled: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={filled ? '/icons/fav-filled.png' : '/icons/fav-outline.png'}
      alt=""
      className={`object-contain ${className}`}
    />
  )
}
