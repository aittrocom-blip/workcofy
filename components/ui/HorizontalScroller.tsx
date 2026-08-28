'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface HorizontalScrollerProps {
  children: ReactNode
  className?: string
}

// Hidden below md: on touch devices swipe already covers this interaction,
// and a small arrow floating over swipeable content is an easy mis-tap.
const ARROW_BUTTON =
  'absolute top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 opacity-80 shadow-sm backdrop-blur-sm transition-all hover:border-black hover:opacity-100 md:flex'

// Wraps a row of horizontally-scrolling items with the native scrollbar
// hidden and edge arrow buttons that page back/forward instead — used by
// the featured-spaces carousel, the space detail photo gallery, and the
// discovery filter bar. Each arrow hides itself once there's nothing left
// to scroll in that direction.
export function HorizontalScroller({ children, className = '' }: HorizontalScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  function updateArrows() {
    const track = trackRef.current
    if (!track) return
    setCanScrollPrev(track.scrollLeft > 4)
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const track = trackRef.current
    if (!track) return
    // Observing the track alone misses overflow growing after mount — its own
    // box doesn't resize when an <img> child finishes loading and gets its
    // real intrinsic width, so we also watch each child directly.
    const observer = new ResizeObserver(updateArrows)
    observer.observe(track)
    for (const child of Array.from(track.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [children])

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className={`no-scrollbar flex scroll-smooth overflow-x-auto ${className}`}
      >
        {children}
      </div>
      {canScrollPrev && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ver anterior"
          className={`${ARROW_BUTTON} left-1.5`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ver más"
          className={`${ARROW_BUTTON} right-1.5`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
  )
}
