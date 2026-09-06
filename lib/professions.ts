// Shared "área profesional" list used by opportunities.area and courses.area
// (and by their public filters). Values must match the `area` check in
// supabase/migrations/0014_opportunities_courses.sql.
export const PROFESSION_OPTIONS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'diseno', label: 'Diseño' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'ingenieria', label: 'Ingeniería' },
  { value: 'legal', label: 'Legal' },
  { value: 'rrhh', label: 'Recursos Humanos' },
  { value: 'educacion', label: 'Educación' },
  { value: 'emprendimiento', label: 'Emprendimiento' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'datos', label: 'Datos' },
  { value: 'producto', label: 'Producto' },
  { value: 'otros', label: 'Otros' },
] as const

export type ProfessionValue = (typeof PROFESSION_OPTIONS)[number]['value']

export const PROFESSION_VALUES: ProfessionValue[] = PROFESSION_OPTIONS.map((option) => option.value)

export function isProfessionValue(value: string): value is ProfessionValue {
  return (PROFESSION_VALUES as string[]).includes(value)
}

export function professionLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return PROFESSION_OPTIONS.find((option) => option.value === value)?.label ?? null
}
