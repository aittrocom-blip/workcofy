import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from '@/lib/hours/openingHours'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { WorkcofyScoreBadge } from '@/components/space/WorkcofyScoreBadge'

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

  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayIndex = now.getDay()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
      <div className="h-64 w-full rounded-3xl bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:h-80" />
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{space.name}</h1>
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

      <a
        href={buildDirectionsUrl(space)}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
      >
        Cómo llegar
      </a>

      <WorkcofyScoreBadge score={space.workcofy_score} />

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
