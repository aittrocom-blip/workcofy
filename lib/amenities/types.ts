export interface ParaTrabajarAmenities {
  wifi: boolean | null
  wifi_rapido: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
  clima: boolean | null
  senal_movil: boolean | null
  [key: string]: boolean | null
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
  sala_reuniones: boolean | null
  [key: string]: boolean | null
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  comida: boolean | null
  impresiones: boolean | null
  pizarra: boolean | null
  pantalla_tv: boolean | null
  proyector: boolean | null
  estacionamiento: boolean | null
  terraza: boolean | null
  pet_friendly: boolean | null
  accesibilidad: boolean | null
  [key: string]: boolean | null
}

export type AmbienteValue = 'muy_silencioso' | 'tranquilo' | 'moderado' | 'animado'

export const AMBIENTE_VALUES: AmbienteValue[] = ['muy_silencioso', 'tranquilo', 'moderado', 'animado']

export type TipoEspacioValue =
  | 'mesa_individual'
  | 'mesa_grupal'
  | 'barra'
  | 'sofa'
  | 'sala_privada'
  | 'terraza_exterior'

export const TIPO_ESPACIO_VALUES: TipoEspacioValue[] = [
  'mesa_individual', 'mesa_grupal', 'barra', 'sofa', 'sala_privada', 'terraza_exterior',
]

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
  ambiente: AmbienteValue | null
  tipo_espacio: TipoEspacioValue[]
}

export const DEFAULT_AMENITIES: AmenitiesData = {
  // Every space is assumed to have basic wifi unless a space's own data
  // explicitly says otherwise — near-universal in Lima/Santiago cafés.
  // "Wifi rápido" is a stronger, unverified claim and stays unknown by default.
  para_trabajar: {
    wifi: true, wifi_rapido: null, enchufes: null, mesas_comodas: null, iluminacion: null,
    clima: null, senal_movil: null,
  },
  para_llamadas: { videollamadas: null, zona_tranquila: null, booth: null, sala_reuniones: null },
  // Café, water, and a bathroom are basic table-stakes for any café — assumed
  // true the same way wifi is, unless a space's own data says otherwise.
  servicios: {
    cafe: true, agua: true, banos: true, comida: null, impresiones: null, pizarra: null,
    pantalla_tv: null, proyector: null, estacionamiento: null, terraza: null, pet_friendly: null,
    accesibilidad: null,
  },
  ambiente: null,
  tipo_espacio: [],
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  wifi_rapido: 'WiFi rápido',
  enchufes: 'Enchufes',
  mesas_comodas: 'Mesas cómodas',
  iluminacion: 'Buena iluminación',
  clima: 'Aire acondicionado / calefacción',
  senal_movil: 'Buena señal móvil',
  videollamadas: 'Videollamadas',
  zona_tranquila: 'Zona tranquila',
  booth: 'Booth / espacio privado',
  sala_reuniones: 'Sala de reuniones',
  cafe: 'Café',
  agua: 'Agua',
  banos: 'Baños',
  comida: 'Comida / snacks',
  impresiones: 'Impresiones',
  pizarra: 'Pizarra',
  pantalla_tv: 'Pantalla / TV',
  proyector: 'Proyector',
  estacionamiento: 'Estacionamiento',
  terraza: 'Terraza / aire libre',
  pet_friendly: 'Pet friendly',
  accesibilidad: 'Accesibilidad',
  muy_silencioso: 'Muy silencioso',
  tranquilo: 'Tranquilo',
  moderado: 'Moderado',
  animado: 'Animado',
  mesa_individual: 'Mesa individual',
  mesa_grupal: 'Mesa grupal',
  barra: 'Barra',
  sofa: 'Sofá',
  sala_privada: 'Sala privada',
  terraza_exterior: 'Terraza / exterior',
}

export const AMENITY_GROUP_LABELS: Record<keyof AmenitiesData, string> = {
  para_trabajar: 'Para trabajar',
  para_llamadas: 'Para llamadas',
  servicios: 'Servicios',
  ambiente: 'Ambiente',
  tipo_espacio: 'Tipo de espacio',
}

// Normalizes whatever raw jsonb comes back from Supabase (typically '{}' today,
// since no seed script populates this column) into a fully-shaped AmenitiesData
// where every leaf is a real boolean/string/array or null — never undefined.
// Called at the data-layer boundary (lib/data/spaces.ts) so every consumer
// downstream can trust SpaceRecord.amenities is actually well-formed, not
// just typed that way.
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

  function parseAmbiente(value: unknown): AmbienteValue | null {
    return typeof value === 'string' && (AMBIENTE_VALUES as string[]).includes(value)
      ? (value as AmbienteValue)
      : null
  }

  function parseTipoEspacio(value: unknown): TipoEspacioValue[] {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is TipoEspacioValue => (TIPO_ESPACIO_VALUES as string[]).includes(item))
  }

  return {
    para_trabajar: parseGroup(DEFAULT_AMENITIES.para_trabajar, source.para_trabajar),
    para_llamadas: parseGroup(DEFAULT_AMENITIES.para_llamadas, source.para_llamadas),
    servicios: parseGroup(DEFAULT_AMENITIES.servicios, source.servicios),
    ambiente: parseAmbiente(source.ambiente),
    tipo_espacio: parseTipoEspacio(source.tipo_espacio),
  }
}

export function averageKnownAmenities(group: Record<string, boolean | null>): number | null {
  const known = Object.values(group).filter((value): value is boolean => value !== null)
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}
