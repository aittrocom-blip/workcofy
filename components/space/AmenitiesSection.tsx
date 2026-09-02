'use client'

import { useState } from 'react'
import { groupedAmenityEntries, type AmenityEntry } from '@/lib/amenities/groupedAmenityEntries'
import { AmenityIcon } from '@/components/space/AmenityIcon'
import { AMENITY_LABELS, type AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

const CHIP_BASE = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium'

const CHIP_STATE = {
  available: `${CHIP_BASE} border-black bg-black text-white`,
  unavailable: `${CHIP_BASE} border-gray-200 bg-white text-gray-400`,
  // Most amenities are unknown until Google or the community confirms them —
  // dashed, but legible (not washed out), since these are exactly the chips
  // a user will eventually tap to confirm and earn Rewards for.
  unknown: `${CHIP_BASE} border-dashed border-gray-300 bg-white text-gray-500`,
}

function AmenityChip({ entry }: { entry: AmenityEntry }) {
  const state = entry.value === true ? 'available' : entry.value === false ? 'unavailable' : 'unknown'
  return (
    <span className={CHIP_STATE[state]} title={state === 'unknown' ? 'Información no disponible' : undefined}>
      <AmenityIcon name={entry.key} className={`h-3 w-3 flex-none ${state === 'available' ? 'invert' : ''}`} />
      <span className={state === 'unavailable' ? 'line-through decoration-gray-300' : ''}>{entry.label}</span>
    </span>
  )
}

function AmenityGroupRow({ title, entries }: { title: string; entries: AmenityEntry[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h4>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <AmenityChip key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function findEntry(
  groups: { groupKey: string; entries: AmenityEntry[] }[],
  groupKey: string,
  key: string
): AmenityEntry {
  const entry = groups.find((group) => group.groupKey === groupKey)?.entries.find((item) => item.key === key)
  return entry ?? { key, label: AMENITY_LABELS[key] ?? key, value: null }
}

const COMODIDAD_KEYS = ['mesas_comodas', 'iluminacion', 'clima']
const SERVICIOS_PRINCIPALES_KEYS = ['cafe', 'agua', 'banos', 'estacionamiento']
const SERVICIOS_RESTO_KEYS = [
  'comida', 'impresiones', 'pizarra', 'pantalla_tv', 'proyector', 'terraza', 'pet_friendly', 'accesibilidad',
]

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const groups = groupedAmenityEntries(amenities)

  const wifi = findEntry(groups, 'para_trabajar', 'wifi')
  const enchufes = findEntry(groups, 'para_trabajar', 'enchufes')
  const wifiRapido = findEntry(groups, 'para_trabajar', 'wifi_rapido')
  const senalMovil = findEntry(groups, 'para_trabajar', 'senal_movil')
  const comodidadEntries = COMODIDAD_KEYS.map((key) => findEntry(groups, 'para_trabajar', key))
  const llamadasEntries = groups.find((group) => group.groupKey === 'para_llamadas')?.entries ?? []
  const serviciosPrincipales = SERVICIOS_PRINCIPALES_KEYS.map((key) => findEntry(groups, 'servicios', key))
  const serviciosResto = SERVICIOS_RESTO_KEYS.map((key) => findEntry(groups, 'servicios', key))

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        <AmenityChip entry={wifi} />
        <AmenityChip entry={enchufes} />
      </div>

      {amenities.ambiente && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</h4>
          <div className="mt-2.5">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
              {AMENITY_LABELS[amenities.ambiente] ?? amenities.ambiente}
            </span>
          </div>
        </div>
      )}

      <AmenityGroupRow title="Comodidad" entries={comodidadEntries} />
      <AmenityGroupRow title="Llamadas" entries={llamadasEntries} />
      <AmenityGroupRow title="Servicios principales" entries={serviciosPrincipales} />

      {expanded && (
        <>
          <AmenityGroupRow title="Más para trabajar" entries={[wifiRapido, senalMovil]} />
          <AmenityGroupRow title="Más servicios" entries={serviciosResto} />
          {amenities.tipo_espacio.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo de espacio</h4>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {amenities.tipo_espacio.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
                  >
                    {AMENITY_LABELS[value] ?? value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="self-start text-xs font-semibold text-gray-500 underline hover:text-black"
      >
        {expanded ? 'Ver menos' : 'Ver todos'}
      </button>
    </div>
  )
}
