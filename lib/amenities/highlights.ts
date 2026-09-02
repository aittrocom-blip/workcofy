import { AMENITY_LABELS, type AmenitiesData } from './types'

// Ordered by how distinctive each amenity is — table-stakes items assumed
// true for almost every café (wifi, cafe, agua, banos) are deliberately
// excluded here, the same way workcofyScore.ts excludes plain wifi from its
// amenities component: they don't help a user tell one space apart from
// another.
const HIGHLIGHT_PRIORITY: { group: 'para_trabajar' | 'para_llamadas' | 'servicios'; key: string }[] = [
  { group: 'para_trabajar', key: 'wifi_rapido' },
  { group: 'para_llamadas', key: 'zona_tranquila' },
  { group: 'para_trabajar', key: 'enchufes' },
  { group: 'para_llamadas', key: 'videollamadas' },
  { group: 'para_llamadas', key: 'booth' },
  { group: 'para_llamadas', key: 'sala_reuniones' },
  { group: 'para_trabajar', key: 'senal_movil' },
  { group: 'para_trabajar', key: 'mesas_comodas' },
  { group: 'para_trabajar', key: 'iluminacion' },
  { group: 'para_trabajar', key: 'clima' },
  { group: 'servicios', key: 'terraza' },
  { group: 'servicios', key: 'pet_friendly' },
  { group: 'servicios', key: 'proyector' },
  { group: 'servicios', key: 'pantalla_tv' },
  { group: 'servicios', key: 'impresiones' },
  { group: 'servicios', key: 'pizarra' },
  { group: 'servicios', key: 'estacionamiento' },
  { group: 'servicios', key: 'accesibilidad' },
  { group: 'servicios', key: 'comida' },
]

// Up to `max` labels for the space's most distinguishing confirmed
// amenities, most relevant first — feeds the one-line summary under the
// Workcofy Score badge. Ambiente (when known) always leads, since it's the
// single strongest "what's it like to work here" signal.
export function topAmenityHighlights(amenities: AmenitiesData, max = 3): string[] {
  const highlights: string[] = []

  if (amenities.ambiente) {
    highlights.push(AMENITY_LABELS[amenities.ambiente] ?? amenities.ambiente)
  }

  for (const { group, key } of HIGHLIGHT_PRIORITY) {
    if (highlights.length >= max) break
    if (amenities[group]?.[key] === true) {
      highlights.push(AMENITY_LABELS[key] ?? key)
    }
  }

  return highlights.slice(0, max)
}
