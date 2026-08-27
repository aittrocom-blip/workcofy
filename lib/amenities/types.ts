export interface ParaTrabajarAmenities {
  wifi: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
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
  [key: string]: boolean | null
}

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
}

export const DEFAULT_AMENITIES: AmenitiesData = {
  para_trabajar: { wifi: null, enchufes: null, mesas_comodas: null, iluminacion: null },
  para_llamadas: { videollamadas: null, zona_tranquila: null, booth: null },
  servicios: {
    cafe: null, agua: null, banos: null, impresiones: null, pizarra: null, sala_reuniones: null,
  },
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  enchufes: 'Enchufes',
  mesas_comodas: 'Mesas cómodas',
  iluminacion: 'Buena iluminación',
  videollamadas: 'Videollamadas',
  zona_tranquila: 'Zona tranquila',
  booth: 'Booth / espacio privado',
  cafe: 'Café',
  agua: 'Agua',
  banos: 'Baños',
  impresiones: 'Impresiones',
  pizarra: 'Pizarra',
  sala_reuniones: 'Sala de reuniones',
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
      result[key] = (typeof value === 'boolean' ? value : null) as T[keyof T]
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
