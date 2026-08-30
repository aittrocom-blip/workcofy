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
  { value: 'cafe', label: 'Café', active: true },
  { value: 'work_cafe', label: 'Work Café', active: true },
  { value: 'coworking', label: 'Coworking', active: false },
  { value: 'meeting_room', label: 'Sala de reunión', active: false },
  { value: 'hotel', label: 'Lobby Café', active: true },
  { value: 'library', label: 'Biblioteca', active: false },
]

export const ACTIVE_CATEGORY_VALUES: CategoryValue[] = CATEGORY_OPTIONS.filter(
  (c) => c.active
).map((c) => c.value)
