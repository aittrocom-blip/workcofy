interface CategoryIconProps {
  name: string
  className?: string
  /** True when the chip this icon sits in is the active/selected one (dark background) — recolors the icon green via a mask instead of the plain black artwork. */
  active?: boolean
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

// One custom-drawn icon per category tile in the discovery filter bar. Black
// artwork on a transparent background, shown as-is on the white/inactive
// chip background. On the active (black) chip background it's recolored
// green via a mask — a PNG can't be recolored with a simple CSS filter, but
// a mask uses the artwork only as a stencil and fills it with any color.
export function CategoryIcon({ name, className = 'h-4 w-4', active = false }: CategoryIconProps) {
  const src = CATEGORY_ICON_SRC[name]
  if (!src) {
    return <span className={`${className} inline-block rounded-full bg-current opacity-60`} aria-hidden="true" />
  }
  if (active) {
    return (
      <span
        aria-hidden="true"
        className={`${className} inline-block flex-none bg-green-400`}
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`${className} object-contain`} />
}
