'use client'

interface MapZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

export function MapZoomControls({ onZoomIn, onZoomOut }: MapZoomControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Acercar"
        className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
      >
        +
      </button>
      <span className="h-px bg-gray-100" />
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Alejar"
        className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
      >
        −
      </button>
    </div>
  )
}
