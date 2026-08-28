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

// Falls back to a pretty-printed version of unlisted values (the expansion
// districts in Chile and outside-Lima Perú aren't in DISTRICTS — that list
// is only the 3 launch districts with dedicated routes) instead of the raw
// snake_case slug.
export function districtLabel(value: string): string {
  const known = DISTRICTS.find((d) => d.value === value)?.label
  if (known) return known
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
