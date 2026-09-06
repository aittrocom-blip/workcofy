import { describe, expect, it } from 'vitest'
import { generateContentSlug } from '@/lib/slug'
import { COURSE_CATEGORIES } from './constants'
import { COURSE_SEED_CATALOG } from './seedCatalog'

describe('COURSE_SEED_CATALOG', () => {
  it('has unique slugs and https URLs', () => {
    const slugs = COURSE_SEED_CATALOG.map((c) => generateContentSlug(c.title, c.provider))
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const course of COURSE_SEED_CATALOG) expect(course.url).toMatch(/^https:\/\//)
  })
  it('covers every category and has featured picks', () => {
    for (const category of COURSE_CATEGORIES) {
      expect(COURSE_SEED_CATALOG.some((c) => c.category === category.value)).toBe(true)
    }
    expect(COURSE_SEED_CATALOG.filter((c) => c.featured).length).toBeGreaterThanOrEqual(3)
  })
  it('sets area for profession courses and tool for tool courses', () => {
    for (const course of COURSE_SEED_CATALOG) {
      if (course.category === 'ia_por_profesion') expect(course.area).toBeTruthy()
      if (course.category === 'herramientas') expect(course.tool).toBeTruthy()
    }
  })
})
