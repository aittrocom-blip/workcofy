import { groupedAmenityEntries, type AmenityEntry } from '@/lib/amenities/groupedAmenityEntries'
import { AmenityIcon } from '@/components/space/AmenityIcon'
import { AMBIENTE_VALUES, AMENITY_LABELS, type AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

// Every amenity in a category always renders — confirmed ones stand out,
// the rest render muted/"desactivado" until the community or an admin
// confirms them, rather than disappearing. Both states share the same pill
// shape and never go solid black, so neither one reads as a selectable
// filter.
function AmenityChip({ entry, size = 'base' }: { entry: AmenityEntry; size?: 'base' | 'sm' }) {
  const confirmed = entry.value === true
  return (
    <span
      title={confirmed ? undefined : 'Todavía no confirmado'}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } ${
        confirmed
          ? 'border-workcofy-yellow bg-workcofy-yellow text-black'
          : 'border-gray-100 bg-gray-50 text-gray-300'
      }`}
    >
      {confirmed && <span className="text-black">✓</span>}
      <AmenityIcon
        name={entry.key}
        className={`${size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} flex-none ${confirmed ? '' : 'opacity-40'}`}
      />
      {entry.label}
    </span>
  )
}

function AmbienteChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      title={active ? undefined : 'Todavía no confirmado'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium ${
        active ? 'border-workcofy-yellow bg-workcofy-yellow text-black' : 'border-gray-100 bg-gray-50 text-gray-300'
      }`}
    >
      {active && <span className="text-black">✓</span>}
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-black' : 'bg-gray-300'}`} />
      {label}
    </span>
  )
}

// Confirmed amenities float to the front of their category so the section
// still reads at a glance despite always showing every amenity.
function sortConfirmedFirst(entries: AmenityEntry[]): AmenityEntry[] {
  return [...entries].sort((a, b) => (a.value === true ? 0 : 1) - (b.value === true ? 0 : 1))
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
        {sortConfirmedFirst(entries).map((entry) => (
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

  return (
    <div className="mt-6">
      <h3 className="text-base font-bold tracking-tight">¿Qué encontrarás aquí?</h3>

      <div className="mt-4 flex flex-col gap-5">
        <AmenityCategory title="Para trabajar" entries={paraTrabajar} emphasis="primary" />
        <AmenityCategory title="Para llamadas" entries={paraLlamadas} emphasis="secondary" />
        <AmenityCategory title="Servicios" entries={servicios} emphasis="compact" />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AMBIENTE_VALUES.map((value) => (
              <AmbienteChip
                key={value}
                label={AMENITY_LABELS[value] ?? value}
                active={amenities.ambiente === value}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
