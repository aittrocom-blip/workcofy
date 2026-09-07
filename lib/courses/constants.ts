export const COURSE_CATEGORIES = [
  {
    value: 'ia_desde_cero',
    slug: 'ia-desde-cero',
    label: 'IA desde cero',
    description: 'Para personas sin experiencia previa en inteligencia artificial.',
  },
  {
    value: 'ia_por_profesion',
    slug: 'ia-por-profesion',
    label: 'IA por profesión',
    description: 'Cómo aplicar IA en marketing, ventas, diseño, finanzas y otras áreas.',
  },
  {
    value: 'herramientas',
    slug: 'herramientas',
    label: 'Herramientas',
    description: 'Aprende a usar ChatGPT, Claude, Gemini, Copilot y herramientas de automatización.',
  },
  {
    value: 'certificaciones',
    slug: 'certificaciones',
    label: 'Cursos y certificaciones',
    description: 'Certificaciones oficiales de IA de Microsoft, Google, AWS y otros proveedores.',
  },
] as const
export type CourseCategory = (typeof COURSE_CATEGORIES)[number]['value']

export const COURSE_TOOLS = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'automatizacion', label: 'Automatización' },
  { value: 'productividad', label: 'Productividad' },
] as const
export type CourseTool = (typeof COURSE_TOOLS)[number]['value']

export const COURSE_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]['value']

export const COURSE_PRICES = [
  { value: 'gratis', label: 'Gratis' },
  { value: 'pago', label: 'Pago' },
] as const
export type CoursePrice = (typeof COURSE_PRICES)[number]['value']

export const COURSE_LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'multi', label: 'Varios idiomas' },
] as const
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number]['value']

// price_text can be a full sentence (e.g. "USD 99 aprox. el examen; preparación
// gratuita en Microsoft Learn") — too long to be the card's headline without
// overflowing it. The headline is always the plain Gratis/Pago chip; the raw
// price_text (if any) is shown underneath instead, small and out of the way.
export function coursePriceDisplay(
  price: CoursePrice,
  priceText: string | null
): { label: string; detail: string | null } {
  return { label: price === 'gratis' ? 'Gratis' : 'Pago', detail: priceText }
}

export function courseCategoryFromSlug(slug: string) {
  return COURSE_CATEGORIES.find((category) => category.slug === slug) ?? null
}

export function courseCategoryFromValue(value: string | null | undefined) {
  if (!value) return null
  return COURSE_CATEGORIES.find((category) => category.value === value) ?? null
}
