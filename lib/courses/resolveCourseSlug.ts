import { isProfessionValue, professionLabel } from '@/lib/professions'
import { courseCategoryFromSlug } from './constants'
import type { CourseFilters } from './queryBuilder'

export interface ResolvedCourseSlug {
  title: string
  description: string
  filters: CourseFilters
}

// /aprende/[slug] accepts the four category slugs plus `ia-para-<area>`
// (master spec §38 example: /aprende/ia-para-marketing).
export function resolveCourseSlug(slug: string): ResolvedCourseSlug | null {
  const category = courseCategoryFromSlug(slug)
  if (category) return { title: category.label, description: category.description, filters: { category: category.value } }

  const match = slug.match(/^ia-para-([a-z]+)$/)
  if (match && isProfessionValue(match[1])) {
    const label = professionLabel(match[1]) as string
    return {
      title: `IA para ${label}`,
      description: `Cursos y certificaciones oficiales para aplicar inteligencia artificial en ${label.toLowerCase()}.`,
      filters: { category: 'ia_por_profesion', area: match[1] },
    }
  }
  return null
}
