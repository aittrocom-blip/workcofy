import { AMENITY_GROUP_LABELS, AMENITY_LABELS, type AmenitiesData } from './types'

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
  return (Object.keys(amenities) as (keyof AmenitiesData)[]).map((groupKey) => ({
    groupKey,
    groupLabel: AMENITY_GROUP_LABELS[groupKey],
    entries: Object.entries(amenities[groupKey]).map(([key, value]) => ({
      key,
      label: AMENITY_LABELS[key] ?? key,
      value: value as boolean | null,
    })),
  }))
}
