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

export function groupedAmenityEntries(amenities: AmenitiesData): AmenityGroupEntries[] {
  const safe = amenities ?? DEFAULT_AMENITIES
  return (Object.keys(DEFAULT_AMENITIES) as (keyof AmenitiesData)[]).map((groupKey) => ({
    groupKey,
    groupLabel: AMENITY_GROUP_LABELS[groupKey],
    entries: Object.entries(safe[groupKey] ?? DEFAULT_AMENITIES[groupKey]).map(([key, value]) => ({
      key,
      label: AMENITY_LABELS[key] ?? key,
      value: value as boolean | null,
    })),
  }))
}
