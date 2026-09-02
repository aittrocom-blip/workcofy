import { AMENITY_GROUP_LABELS, AMENITY_LABELS, DEFAULT_AMENITIES, type AmenitiesData } from './types'

export interface AmenityEntry {
  key: string
  label: string
  value: boolean | null
}

export interface AmenityGroupEntries {
  groupKey: keyof AmenitiesData
  groupLabel: string
  entries: AmenityEntry[]
}

// Only the boolean-leaf groups — `ambiente` (a single string) and
// `tipo_espacio` (a string array) don't fit this true/false/null entry
// shape and are rendered by their own dedicated UI instead (see
// AmenitiesSection and the admin AmenitiesEditorForm).
const BOOLEAN_GROUP_KEYS = ['para_trabajar', 'para_llamadas', 'servicios'] as const

export function groupedAmenityEntries(amenities: AmenitiesData): AmenityGroupEntries[] {
  const safe = amenities ?? DEFAULT_AMENITIES
  return BOOLEAN_GROUP_KEYS.map((groupKey) => ({
    groupKey,
    groupLabel: AMENITY_GROUP_LABELS[groupKey],
    entries: Object.entries(safe[groupKey] ?? DEFAULT_AMENITIES[groupKey]).map(([key, value]) => ({
      key,
      label: AMENITY_LABELS[key] ?? key,
      value: value as boolean | null,
    })),
  }))
}
