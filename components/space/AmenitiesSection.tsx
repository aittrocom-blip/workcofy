import { groupedAmenityEntries, type AmenityEntry } from '@/lib/amenities/groupedAmenityEntries'
import { AmenityIcon } from '@/components/space/AmenityIcon'
import { AMENITY_LABELS, type AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

// Only what the space actually has — false/unknown amenities are simply
// omitted rather than shown as "not available" or "unconfirmed", so this
// never reads like a filter or a form.
function AmenityChip({ entry, size = 'base' }: { entry: AmenityEntry; size?: 'base' | 'sm' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white font-medium text-gray-700 ${
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      }`}
    >
      <span className="text-black">✓</span>
      <AmenityIcon name={entry.key} className={size === 'sm' ? 'h-3 w-3 flex-none' : 'h-3.5 w-3.5 flex-none'} />
      {entry.label}
    </span>
  )
}

function AmenityCategory({
  title,
  entries,
  emphasis,
}: {
  title: string
  entries: AmenityEntry[]
  emphasis: 'primary' | 'secondary' | 'compact'
}) {
  const confirmed = entries.filter((entry) => entry.value === true)
  if (confirmed.length === 0) return null

  return (
    <div>
      <h4
        className={
          emphasis === 'primary'
            ? 'text-sm font-bold tracking-tight'
            : emphasis === 'secondary'
              ? 'text-xs font-semibold uppercase tracking-wide text-gray-500'
              : 'text-xs font-semibold uppercase tracking-wide text-gray-400'
        }
      >
        {title}
      </h4>
      <div className={`flex flex-wrap gap-1.5 ${emphasis === 'primary' ? 'mt-2.5' : 'mt-2'}`}>
        {confirmed.map((entry) => (
          <AmenityChip key={entry.key} entry={entry} size={emphasis === 'compact' ? 'sm' : 'base'} />
        ))}
      </div>
    </div>
  )
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const groups = groupedAmenityEntries(amenities)
  const paraTrabajar = groups.find((group) => group.groupKey === 'para_trabajar')?.entries ?? []
  const paraLlamadas = groups.find((group) => group.groupKey === 'para_llamadas')?.entries ?? []
  const servicios = groups.find((group) => group.groupKey === 'servicios')?.entries ?? []
  const ambienteLabel = amenities.ambiente ? AMENITY_LABELS[amenities.ambiente] ?? amenities.ambiente : null

  const hasAnything =
    paraTrabajar.some((entry) => entry.value === true) ||
    paraLlamadas.some((entry) => entry.value === true) ||
    servicios.some((entry) => entry.value === true) ||
    ambienteLabel != null

  return (
    <div className="mt-6">
      <h3 className="text-base font-bold tracking-tight">¿Qué encontrarás aquí?</h3>

      {hasAnything ? (
        <div className="mt-4 flex flex-col gap-5">
          <AmenityCategory title="Para trabajar" entries={paraTrabajar} emphasis="primary" />
          <AmenityCategory title="Para llamadas" entries={paraLlamadas} emphasis="secondary" />
          <AmenityCategory title="Servicios" entries={servicios} emphasis="compact" />

          {ambienteLabel && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-black" />
                {ambienteLabel}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">Todavía no tenemos esta información confirmada.</p>
      )}
    </div>
  )
}
