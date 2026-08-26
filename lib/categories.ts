export type CategoryValue =
  | 'cafe'
  | 'work_cafe'
  | 'coworking'
  | 'meeting_room'
  | 'hotel'
  | 'workshop'
  | 'event'
  | 'corporate'

export interface CategoryOption {
  value: CategoryValue
  label: string
  active: boolean
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'cafe', label: 'Cafés', active: true },
  { value: 'work_cafe', label: 'Work Cafés', active: true },
  { value: 'coworking', label: 'Coworking', active: false },
  { value: 'meeting_room', label: 'Reuniones', active: false },
  { value: 'workshop', label: 'Workshops', active: false },
  { value: 'event', label: 'Eventos', active: false },
]

export const ACTIVE_CATEGORY_VALUES: CategoryValue[] = CATEGORY_OPTIONS.filter(
  (c) => c.active
).map((c) => c.value)
