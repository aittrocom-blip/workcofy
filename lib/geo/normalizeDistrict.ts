// Converts a free-text locality name ("Las Condes", "Ñuñoa", "San Isidro")
// into the lowercase snake_case form stored in spaces.district, matching the
// convention lib/districts.ts already uses for the original 3 Lima values.
export function normalizeDistrict(localidad: string): string {
  return localidad
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
