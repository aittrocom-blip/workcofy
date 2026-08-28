'use client'

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface DraggableFloatingBarProps {
  children: ReactNode
  className?: string
}

const GRIP_HANDLE =
  'flex cursor-grab touch-none items-center justify-center border-gray-200 bg-white text-gray-400 shadow-sm active:cursor-grabbing'

// A corner grip handle lets the user reposition the floating filter bar
// anywhere over the full-screen map, clamped so it can't be dragged out of
// view. Defaults to its normal top-left flow position until first dragged.
export function DraggableFloatingBar({ children, className = '' }: DraggableFloatingBarProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  )

  function getParentRect() {
    const parent = wrapperRef.current?.offsetParent as HTMLElement | null
    return parent?.getBoundingClientRect() ?? null
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const el = wrapperRef.current
    const parentRect = getParentRect()
    if (!el || !parentRect) return
    const rect = el.getBoundingClientRect()
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      origX: pos?.x ?? rect.left - parentRect.left,
      origY: pos?.y ?? rect.top - parentRect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragState.current
    const el = wrapperRef.current
    const parentRect = getParentRect()
    if (!drag || !el || !parentRect) return
    const nextX = drag.origX + (event.clientX - drag.startX)
    const nextY = drag.origY + (event.clientY - drag.startY)
    const maxX = Math.max(0, parentRect.width - el.offsetWidth)
    const maxY = Math.max(0, parentRect.height - el.offsetHeight)
    setPos({ x: Math.min(Math.max(0, nextX), maxX), y: Math.min(Math.max(0, nextY), maxY) })
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragState.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp }

  // A rotation or a mobile browser's address bar collapsing/expanding
  // changes the parent's size without any drag happening — re-clamp so a
  // previously-dragged bar can't end up positioned off-screen.
  useEffect(() => {
    function reclamp() {
      const el = wrapperRef.current
      const parentRect = getParentRect()
      if (!el || !parentRect) return
      setPos((current) => {
        if (!current) return current
        const maxX = Math.max(0, parentRect.width - el.offsetWidth)
        const maxY = Math.max(0, parentRect.height - el.offsetHeight)
        return { x: Math.min(current.x, maxX), y: Math.min(current.y, maxY) }
      })
    }
    window.addEventListener('resize', reclamp)
    window.addEventListener('orientationchange', reclamp)
    return () => {
      window.removeEventListener('resize', reclamp)
      window.removeEventListener('orientationchange', reclamp)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      style={pos ? { position: 'absolute', left: pos.x, top: pos.y } : undefined}
    >
      {children}

      <div
        {...dragHandlers}
        className={`${GRIP_HANDLE} absolute -bottom-2.5 -right-2.5 h-10 w-10 rounded-full border`}
        title="Arrastrar para mover"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <circle cx="8" cy="16" r="1.6" />
          <circle cx="14" cy="16" r="1.6" />
          <circle cx="20" cy="16" r="1.6" />
          <circle cx="14" cy="10" r="1.6" />
          <circle cx="20" cy="10" r="1.6" />
          <circle cx="20" cy="4" r="1.6" />
        </svg>
      </div>
    </div>
  )
}
