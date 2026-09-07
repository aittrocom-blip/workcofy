export type CategoryValue =
  | 'cafe'
  | 'work_cafe'
  | 'coworking'
  | 'meeting_room'
  | 'hotel'
  | 'corporate'
  | 'library'

export interface CategoryOption {
  value: CategoryValue
  label: string
  active: boolean
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'cafe', label: 'Workfriendly', active: true },
  { value: 'work_cafe', label: 'Work Café', active: true },
  { value: 'coworking', label: 'Coworking', active: true },
  { value: 'meeting_room', label: 'Sala de reunión', active: false },
  { value: 'hotel', label: 'Lobby Café', active: true },
  { value: 'library', label: 'Biblioteca', active: false },
]

export const ACTIVE_CATEGORY_VALUES: CategoryValue[] = CATEGORY_OPTIONS.filter(
  (c) => c.active
).map((c) => c.value)

// Shared by every `?category=` reader (discoveryFilters, /espacios,
// /[district]) so a comma-separated multi-select list is parsed the same
// way everywhere: `"cafe,work_cafe"` -> ['cafe', 'work_cafe'], missing/empty -> [].
export function parseCategoryListParam(value: string | null | undefined): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

// Public URL slugs for /espacios/[categoria] (master spec §38).
export interface SpaceCategorySlug {
  slug: string
  value: CategoryValue
  title: string
  description: string
}

export const SPACE_CATEGORY_SLUGS: SpaceCategorySlug[] = [
  {
    slug: 'cafeterias',
    value: 'cafe',
    title: 'Cafeterías para trabajar',
    description: 'Cafés con WiFi, enchufes y buen ambiente para trabajar con tu laptop.',
  },
  {
    slug: 'work-cafe',
    value: 'work_cafe',
    title: 'Work cafés',
    description: 'Cafés pensados para trabajar: mesas amplias, enchufes y zonas tranquilas.',
  },
  {
    slug: 'coworking',
    value: 'coworking',
    title: 'Coworkings',
    description: 'Espacios de coworking con escritorios, salas de reunión y comunidad.',
  },
  {
    slug: 'hoteles',
    value: 'hotel',
    title: 'Lobbies de hotel para trabajar',
    description: 'Lobbies y cafés de hotel donde puedes trabajar entre reuniones.',
  },
  {
    slug: 'bibliotecas',
    value: 'library',
    title: 'Bibliotecas',
    description: 'Bibliotecas y salas de lectura silenciosas para concentrarte.',
  },
]

export function spaceCategoryFromSlug(slug: string): SpaceCategorySlug | null {
  return SPACE_CATEGORY_SLUGS.find((category) => category.slug === slug) ?? null
}
