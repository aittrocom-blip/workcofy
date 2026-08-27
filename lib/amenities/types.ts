export interface ParaTrabajarAmenities {
  wifi: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  impresiones: boolean | null
  pizarra: boolean | null
  sala_reuniones: boolean | null
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

export function averageKnownAmenities(group: Record<string, boolean | null>): number | null {
  const known = Object.values(group).filter((value): value is boolean => value !== null)
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}
