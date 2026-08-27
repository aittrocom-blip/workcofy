import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { listSpaceBenefits } from '@/lib/data/benefits'
import { districtLabel } from '@/lib/districts'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from '@/lib/hours/openingHours'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { WorkcofyScoreBadge } from '@/components/space/WorkcofyScoreBadge'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { AmenitiesSection } from '@/components/space/AmenitiesSection'
import { AMENITY_LABELS } from '@/lib/amenities/types'

interface SpacePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: SpacePageProps) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) return {}
  const label = districtLabel(space.district)
  return {
    title: `${space.name} | Workcofy`,
    description: `Encuentra ubicación, horario, valoración y cómo llegar a ${space.name} en ${label}.`,
    openGraph: {
      title: `${space.name} | Workcofy`,
      description: `Encuentra ubicación, horario, valoración y cómo llegar a ${space.name} en ${label}.`,
    },
  }
}

export default async function SpacePage({ params }: SpacePageProps) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) notFound()

  const benefits = await listSpaceBenefits(space.id)
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayIndex = now.getDay()
  const renderablePhotos = (space.photos ?? []).filter(
    (photo): photo is typeof photo & { url: string } => Boolean(photo.url)
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
      {renderablePhotos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {renderablePhotos.map((photo, index) => (
            <img
              key={index}
              src={photo.url}
              alt={`${space.name} — foto ${index + 1}`}
              className="h-64 w-auto flex-none rounded-3xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:h-80"
            />
          ))}
        </div>
      ) : (
        <div className="h-64 w-full rounded-3xl bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:h-80" />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{space.name}</h1>
        {space.verified && <VerifiedBadge />}
      </div>
      <p className="mt-1 text-gray-500">{districtLabel(space.district)}</p>
      {space.data_source === 'mock' && (
        <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          Datos de ejemplo
        </span>
      )}
      <div className="mt-3 flex items-center gap-3 text-sm">
        {space.rating != null && (
          <span>
            ★ {space.rating.toFixed(1)} ({space.review_count ?? 0} reseñas)
          </span>
        )}
        <span className={openNow ? 'font-semibold text-black' : 'text-gray-500'}>
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
        {space.instagram_url && (
          <a href={space.instagram_url} target="_blank" rel="noreferrer" className="hover:text-black">
            Instagram
          </a>
        )}
      </div>

      <a
        href={buildDirectionsUrl(space)}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
      >
        Cómo llegar
      </a>

      <WorkcofyScoreBadge space={space} />

      {space.verified && space.verified_amenities.length > 0 && (
        <div className="mt-6 rounded-2xl border border-workcofy-yellow/40 bg-workcofy-yellow/10 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Workcofy comprobó este espacio</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {space.verified_amenities.map((key) => (
              <li key={key}>✓ {AMENITY_LABELS[key] ?? key}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-10 text-xl font-bold tracking-tight">Amenities</h2>
      <AmenitiesSection amenities={space.amenities} />

      {benefits.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold tracking-tight">Beneficios Workcofy</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {benefits.map((benefit) => (
              <li key={benefit.id} className="flex items-center gap-2">
                {benefit.icon && <span>{benefit.icon}</span>}
                {benefit.label}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-10 text-xl font-bold tracking-tight">Horario</h2>
      <ul className="mt-3 overflow-hidden rounded-2xl border border-gray-100 text-sm">
        {WEEK_DISPLAY_ORDER.map((dayIndex) => (
          <li
            key={dayIndex}
            className={`flex justify-between border-b border-gray-100 px-4 py-2.5 last:border-b-0 ${
              dayIndex === todayIndex ? 'bg-gray-50 font-semibold' : ''
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
  )
}
