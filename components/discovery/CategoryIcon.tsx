interface CategoryIconProps {
  name: string
  className?: string
}

const CATEGORY_ICON_SRC: Record<string, string> = {
  todos: '/icons/cat-todos.png',
  cafe: '/icons/cat-cafe.png',
  work_cafe: '/icons/cat-work-cafe.png',
  coworking: '/icons/cat-coworking.png',
  hotel: '/icons/cat-hotel.png',
  meeting_room: '/icons/cat-meeting-room.png',
  library: '/icons/cat-biblioteca.png',
}

// One custom-drawn icon per category tile in the discovery filter bar.
// Black artwork on a transparent background — pass an `invert` className
// (via the `filter` utility) when placed on a dark/active background.
export function CategoryIcon({ name, className = 'h-4 w-4' }: CategoryIconProps) {
  const src = CATEGORY_ICON_SRC[name]
  if (!src) {
    return <span className={`${className} inline-block rounded-full bg-current opacity-60`} aria-hidden="true" />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`${className} object-contain`} />
}
