export type CountryValue = 'pe' | 'cl'

export const COUNTRY_OPTIONS: { value: CountryValue; label: string; flag: string }[] = [
  { value: 'pe', label: 'Perú', flag: '🇵🇪' },
  { value: 'cl', label: 'Chile', flag: '🇨🇱' },
]

export function countryLabel(value: string): string {
  return COUNTRY_OPTIONS.find((c) => c.value === value)?.label ?? value
}
