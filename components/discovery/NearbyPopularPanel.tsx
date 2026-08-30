'use client'

import { useEffect, useMemo, useState } from 'react'
import { CompactSpaceRow } from '@/components/discovery/CompactSpaceRow'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface NearbyPopularPanelProps {
  spaces: SpaceWithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const VISIBLE_COUNT = 3
const ROTATE_INTERVAL_MS = 30_000

// Compact "popular near you" widget for the full-screen map — shows only
// VISIBLE_COUNT spaces at a time and auto-rotates to the next group instead
// of growing into a tall scrollable list, so it never competes with the map
// for screen space. Rotation pauses while the user's cursor is on it.
export function NearbyPopularPanel({ spaces, selectedId, onSelect }: NearbyPopularPanelProps) {
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const pageCount = Math.max(1, Math.ceil(spaces.length / VISIBLE_COUNT))

  useEffect(() => {
    setPage(0)
  }, [spaces.length])

  useEffect(() => {
    if (paused || pageCount <= 1) return
    const id = setInterval(() => setPage((current) => (current + 1) % pageCount), ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, pageCount])

  const visible = useMemo(
    () => spaces.slice(page * VISIBLE_COUNT, page * VISIBLE_COUNT + VISIBLE_COUNT),
    [spaces, page]
  )

  if (spaces.length === 0) return null

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto flex flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_18px_48px_rgba(17,24,39,0.18)] backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Para descubrir cerca</h2>
        <span className="rounded-full bg-workcofy-yellow/20 px-2 py-0.5 text-[10px] font-bold text-workcofy-black">
          {spaces.length}
        </span>
      </div>
      <div key={page} className="animate-fade-in flex flex-col gap-0.5 p-1.5">
        {visible.map((space) => (
          <CompactSpaceRow
            key={space.id}
            space={space}
            isSelected={space.id === selectedId}
            onSelect={() => onSelect(space.id)}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-2">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver grupo ${index + 1}`}
              onClick={() => setPage(index)}
              className="flex h-8 w-8 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  index === page ? 'w-4 bg-black' : 'w-1.5 bg-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
