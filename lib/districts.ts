export type DistrictSlug = 'miraflores' | 'san-isidro' | 'barranco'
export type DistrictValue = 'miraflores' | 'san_isidro' | 'barranco'

export const DISTRICTS: { slug: DistrictSlug; value: DistrictValue; label: string }[] = [
  { slug: 'miraflores', value: 'miraflores', label: 'Miraflores' },
  { slug: 'san-isidro', value: 'san_isidro', label: 'San Isidro' },
  { slug: 'barranco', value: 'barranco', label: 'Barranco' },
]

export const DISTRICT_CENTROIDS: Record<DistrictValue, { lat: number; lng: number }> = {
  miraflores: { lat: -12.1211, lng: -77.0295 },
  san_isidro: { lat: -12.0969, lng: -77.0367 },
  barranco: { lat: -12.1481, lng: -77.0219 },
}

export function districtValueFromSlug(slug: string): DistrictValue | null {
  return DISTRICTS.find((d) => d.slug === slug)?.value ?? null
}

export function districtSlugFromValue(value: string): DistrictSlug | null {
  return DISTRICTS.find((d) => d.value === value)?.slug ?? null
}

export function districtLabel(value: string): string {
  return DISTRICTS.find((d) => d.value === value)?.label ?? value
}
