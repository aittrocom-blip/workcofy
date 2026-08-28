'use client'

import { districtLabel } from '@/lib/districts'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from '@/lib/hours/openingHours'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { formatPriceLevel } from '@/lib/priceLevel'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { FavoriteButton } from '@/components/space/FavoriteButton'
import { VisitorAvatarsStrip } from '@/components/space/VisitorAvatarsStrip'
import { AmenitiesSection } from '@/components/space/AmenitiesSection'
import { AMENITY_LABELS } from '@/lib/amenities/types'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceDetailPanelProps {
  space: SpaceWithDistance
  onClose: () => void
  origin?: { lat: number; lng: number } | null
}

// The map-mode side panel — same content as the full /spaces/[slug] page,
// reusing its sub-components, but taking the space directly (it's already in
// memory from the discovery list) instead of fetching. Benefits and the
// view-count increment are server-only concerns of that page and are
// deliberately skipped here.
export function SpaceDetailPanel({ space, onClose, origin = null }: SpaceDetailPanelProps) {
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayIndex = now.getDay()
  const score = computeWorkcofyScore(space)
  const priceLevel = formatPriceLevel(space.price_level)
  const renderablePhotos = (space.photos ?? []).filter(
    (photo): photo is typeof photo & { url: string } => Boolean(photo.url)
  )

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-end border-b border-gray-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-black hover:text-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-10 pt-4 md:px-6">
        {renderablePhotos.length > 0 ? (
          <HorizontalScroller className="gap-2">
            {renderablePhotos.map((photo, index) => (
              <img
                key={index}
                src={photo.url}
                alt={`${space.name} — foto ${index + 1}`}
                className="h-44 w-auto flex-none rounded-2xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              />
            ))}
          </HorizontalScroller>
        ) : (
          <div className="h-44 w-full rounded-2xl bg-gray-100" />
        )}

        <div className="mt-4">
          <VisitorAvatarsStrip spaceId={space.id} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">{space.name}</h2>
          {space.verified && <VerifiedBadge />}
        </div>
        <p className="mt-1 text-sm text-gray-500">{districtLabel(space.district)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {space.rating != null && (
            <span className="inline-flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/nav-star.png" alt="" className="h-3 w-3" />
              {space.rating.toFixed(1)} ({space.review_count ?? 0})
            </span>
          )}
          {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
          {priceLevel && <span className="text-gray-500">{priceLevel}</span>}
          {score != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-workcofy-yellow/15 px-2 py-0.5 text-xs font-semibold">
              <span className="text-workcofy-yellow">{score}</span> Workcofy Score
            </span>
          )}
          <span className={`inline-flex items-center gap-1 ${openNow ? 'font-semibold text-black' : 'text-gray-500'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={openNow ? '/icons/status-abierto.png' : '/icons/status-cerrado.png'}
              alt=""
              className="h-4 w-auto"
            />
            {openNow ? 'Abierto ahora' : 'Cerrado'}
          </span>
        </div>
        {space.address && <p className="mt-2 text-sm text-gray-600">{space.address}</p>}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          {space.phone && (
            <a href={`tel:${space.phone}`} className="hover:text-black">
              {space.phone}
            </a>
          )}
          {space.website && (
            <a href={space.website} target="_blank" rel="noreferrer" className="hover:text-black">
              Sitio web
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={buildDirectionsUrl(space, origin)}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            Cómo llegar
          </a>
          <FavoriteButton
            spaceId={space.id}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gray-200 p-2 hover:border-black"
          />
          <a
            href={`/spaces/${space.slug}`}
            className="inline-block rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-black"
          >
            Ver ficha completa
          </a>
          <span
            className="inline-flex cursor-not-allowed items-center rounded-full border border-dashed border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-400"
            title="Reserva de asiento o espacio — todavía no disponible"
          >
            Reservar
          </span>
        </div>

        {space.verified && space.verified_amenities.length > 0 && (
          <div className="mt-5 rounded-2xl border border-workcofy-green/40 bg-workcofy-green/10 p-4">
            <h3 className="text-sm font-semibold tracking-tight">Workcofy comprobó este espacio</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {space.verified_amenities.map((key) => (
                <li key={key}>✓ {AMENITY_LABELS[key] ?? key}</li>
              ))}
            </ul>
          </div>
        )}

        <h3 className="mt-8 text-lg font-bold tracking-tight">Amenities</h3>
        <AmenitiesSection amenities={space.amenities} />

        <h3 className="mt-8 text-lg font-bold tracking-tight">Horario</h3>
        <ul className="mt-3 overflow-hidden rounded-2xl border border-gray-100 text-sm">
          {WEEK_DISPLAY_ORDER.map((dayIndex) => (
            <li
              key={dayIndex}
              className={`flex justify-between border-b border-gray-100 px-4 py-2.5 last:border-b-0 ${
                dayIndex === todayIndex ? 'bg-black font-semibold text-white' : ''
              }`}
            >
              <span>
                {DAY_LABELS[dayIndex]}
                {dayIndex === todayIndex && ' · Hoy'}
              </span>
              <span>{formatPeriodForDay(space.opening_hours, dayIndex)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
