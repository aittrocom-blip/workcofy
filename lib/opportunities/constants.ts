export const OPPORTUNITY_TYPES = [
  { value: 'empleo', label: 'Empleo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'practicas', label: 'Prácticas' },
] as const
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]['value']

export const OPPORTUNITY_MODALITIES = [
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'presencial', label: 'Presencial' },
] as const
export type OpportunityModality = (typeof OPPORTUNITY_MODALITIES)[number]['value']

export const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Semi senior' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Expert' },
] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]['value']

export const OPPORTUNITY_LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
] as const
export type OpportunityLanguage = (typeof OPPORTUNITY_LANGUAGES)[number]['value']

export const OPPORTUNITY_SOURCES = [
  { value: 'getonboard', label: 'Get on Board' },
  { value: 'weremoto', label: 'WeRemoto' },
  { value: 'manual', label: 'Workcofy' },
] as const
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number]['value']

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

// ISO-2 lowercase. Not lib/countries.ts (that list is the two countries
// with spaces on the map); opportunities span all of LatAm plus Spain/US.
export const OPPORTUNITY_COUNTRIES = [
  { value: 'pe', label: 'Perú' },
  { value: 'cl', label: 'Chile' },
  { value: 'mx', label: 'México' },
  { value: 'co', label: 'Colombia' },
  { value: 'ar', label: 'Argentina' },
  { value: 'uy', label: 'Uruguay' },
  { value: 'ec', label: 'Ecuador' },
  { value: 'bo', label: 'Bolivia' },
  { value: 'py', label: 'Paraguay' },
  { value: 've', label: 'Venezuela' },
  { value: 'br', label: 'Brasil' },
  { value: 'cr', label: 'Costa Rica' },
  { value: 'pa', label: 'Panamá' },
  { value: 'gt', label: 'Guatemala' },
  { value: 'do', label: 'República Dominicana' },
  { value: 'sv', label: 'El Salvador' },
  { value: 'hn', label: 'Honduras' },
  { value: 'ni', label: 'Nicaragua' },
  { value: 'es', label: 'España' },
  { value: 'us', label: 'Estados Unidos' },
] as const
export type OpportunityCountry = (typeof OPPORTUNITY_COUNTRIES)[number]['value']

// The "categorías" (originally the five from master spec §9, plus Empleo)
// are URL views over three orthogonal columns (see design spec §2.1) — each
// slug is a fixed filter.
export interface OpportunityCategory {
  slug: string
  label: string
  title: string
  description: string
  filter: { type?: OpportunityType; modality?: OpportunityModality; ai?: true }
}

export const OPPORTUNITY_CATEGORY_SLUGS: OpportunityCategory[] = [
  {
    slug: 'remoto',
    label: 'Remoto',
    title: 'Trabajo remoto',
    description: 'Oportunidades de trabajo remoto para Perú, LatAm y el mundo.',
    filter: { modality: 'remoto' },
  },
  {
    slug: 'empleo',
    label: 'Empleo',
    title: 'Empleos',
    description: 'Puestos de trabajo a tiempo completo o medio tiempo.',
    filter: { type: 'empleo' },
  },
  {
    slug: 'freelance',
    label: 'Freelance',
    title: 'Oportunidades freelance',
    description: 'Proyectos y trabajos independientes para profesionales freelance.',
    filter: { type: 'freelance' },
  },
  {
    slug: 'proyectos',
    label: 'Proyectos',
    title: 'Proyectos',
    description: 'Trabajos puntuales o por proyecto.',
    filter: { type: 'proyecto' },
  },
  {
    slug: 'practicas',
    label: 'Prácticas',
    title: 'Prácticas profesionales',
    description: 'Prácticas y oportunidades para quienes están comenzando.',
    filter: { type: 'practicas' },
  },
  {
    slug: 'ia',
    label: 'IA',
    title: 'Oportunidades en inteligencia artificial',
    description: 'Trabajos y proyectos relacionados directa o indirectamente con IA.',
    filter: { ai: true },
  },
]

export function opportunityCategoryFromSlug(slug: string): OpportunityCategory | null {
  return OPPORTUNITY_CATEGORY_SLUGS.find((category) => category.slug === slug) ?? null
}
