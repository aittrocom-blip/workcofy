export interface ParaTrabajarAmenities {
  wifi: boolean | null
  wifi_rapido: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
  aire_acondicionado: boolean | null
  [key: string]: boolean | null
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
  [key: string]: boolean | null
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  impresiones: boolean | null
  pizarra: boolean | null
  sala_reuniones: boolean | null
  proyector: boolean | null
  estacionamiento: boolean | null
  terraza: boolean | null
  pet_friendly: boolean | null
  accesibilidad: boolean | null
  [key: string]: boolean | null
}

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
}

export const DEFAULT_AMENITIES: AmenitiesData = {
  // Every space is assumed to have basic wifi unless a space's own data
  // explicitly says otherwise — near-universal in Lima/Santiago cafés.
  // "Wifi rápido" is a stronger, unverified claim and stays unknown by default.
  para_trabajar: {
    wifi: true, wifi_rapido: null, enchufes: null, mesas_comodas: null, iluminacion: null,
    aire_acondicionado: null,
  },
  para_llamadas: { videollamadas: null, zona_tranquila: null, booth: null },
  // Café, water, and a bathroom are basic table-stakes for any café — assumed
  // true the same way wifi is, unless a space's own data says otherwise.
  servicios: {
    cafe: true, agua: true, banos: true, impresiones: null, pizarra: null, sala_reuniones: null,
    proyector: null, estacionamiento: null, terraza: null, pet_friendly: null, accesibilidad: null,
  },
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  wifi_rapido: 'WiFi rápido',
  enchufes: 'Enchufes',
  mesas_comodas: 'Mesas cómodas',
  iluminacion: 'Buena iluminación',
  aire_acondicionado: 'Aire acondicionado',
  videollamadas: 'Videollamadas',
  zona_tranquila: 'Zona tranquila',
  booth: 'Booth / espacio privado',
  cafe: 'Café',
  agua: 'Agua',
  banos: 'Baños',
  impresiones: 'Impresiones',
  pizarra: 'Pizarra',
  sala_reuniones: 'Sala de reuniones',
  proyector: 'Proyector',
  estacionamiento: 'Estacionamiento',
  terraza: 'Terraza / aire libre',
  pet_friendly: 'Pet friendly',
  accesibilidad: 'Accesibilidad',
}

export const AMENITY_GROUP_LABELS: Record<keyof AmenitiesData, string> = {
  para_trabajar: 'Para trabajar',
  para_llamadas: 'Para llamadas',
  servicios: 'Servicios',
}

// Normalizes whatever raw jsonb comes back from Supabase (typically '{}' today,
// since no seed script populates this column) into a fully-shaped AmenitiesData
// where every leaf is a real boolean or null — never undefined. Called at the
// data-layer boundary (lib/data/spaces.ts) so every consumer downstream can
// trust SpaceRecord.amenities is actually well-formed, not just typed that way.
export function parseAmenities(raw: unknown): AmenitiesData {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof AmenitiesData, unknown>>

  function parseGroup<T extends Record<string, boolean | null>>(defaults: T, group: unknown): T {
    const src = (group && typeof group === 'object' ? group : {}) as Record<string, unknown>
    const result = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = src[key as string]
      result[key] = (typeof value === 'boolean' ? value : defaults[key]) as T[keyof T]
    }
    return result
  }

  return {
    para_trabajar: parseGroup(DEFAULT_AMENITIES.para_trabajar, source.para_trabajar),
    para_llamadas: parseGroup(DEFAULT_AMENITIES.para_llamadas, source.para_llamadas),
    servicios: parseGroup(DEFAULT_AMENITIES.servicios, source.servicios),
  }
}

export function averageKnownAmenities(group: Record<string, boolean | null>): number | null {
  const known = Object.values(group).filter((value): value is boolean => value !== null)
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}
