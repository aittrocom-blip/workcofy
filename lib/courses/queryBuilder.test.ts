import { describe, expect, it } from 'vitest'
import { buildCourseQueryDescriptor, courseFiltersToParams, hasActiveCourseFilters, parseCourseFilters } from './queryBuilder'

describe('parseCourseFilters', () => {
  it('reads Spanish params', () => {
    expect(
      parseCourseFilters({
        q: 'claude',
        categoria: 'herramientas',
        area: 'marketing',
        herramienta: 'claude',
        nivel: 'principiante',
        precio: 'gratis',
        idioma: 'es',
        certificado: '1',
        orden: 'recent',
      })
    ).toEqual({
      q: 'claude',
      category: 'herramientas',
      area: 'marketing',
      tool: 'claude',
      level: 'principiante',
      price: 'gratis',
      language: 'es',
      certificate: true,
      sort: 'recent',
    })
    expect(parseCourseFilters({})).toMatchObject({ q: null, certificate: null, sort: 'relevant' })
  })
})

describe('courseFiltersToParams', () => {
  it('round-trips and omits the default sort', () => {
    expect(courseFiltersToParams({ category: 'ia_desde_cero', certificate: true, sort: 'relevant' })).toEqual({
      categoria: 'ia_desde_cero',
      certificado: '1',
    })
    expect(courseFiltersToParams({ q: 'gpt', sort: 'recent' })).toEqual({ q: 'gpt', orden: 'recent' })
  })
})

describe('buildCourseQueryDescriptor', () => {
  it('keeps only valid values and trims the search term', () => {
    expect(
      buildCourseQueryDescriptor({
        q: '  copilot ',
        category: 'nope',
        area: 'ventas',
        tool: 'gemini',
        level: 'x',
        price: 'pago',
        language: 'multi',
        certificate: true,
        sort: 'recent',
      })
    ).toEqual({
      eqFilters: [
        { column: 'area', value: 'ventas' },
        { column: 'tool', value: 'gemini' },
        { column: 'price', value: 'pago' },
        { column: 'language', value: 'multi' },
      ],
      certificate: true,
      searchTerm: 'copilot',
      sort: 'recent',
    })
    expect(buildCourseQueryDescriptor({})).toEqual({ eqFilters: [], certificate: null, searchTerm: null, sort: 'relevant' })
  })
})

describe('hasActiveCourseFilters', () => {
  it('ignores filters that the route already bakes in', () => {
    expect(hasActiveCourseFilters({ category: 'herramientas' }, { category: 'herramientas' })).toBe(false)
    expect(hasActiveCourseFilters({ category: 'herramientas', level: 'avanzado' }, { category: 'herramientas' })).toBe(true)
    expect(hasActiveCourseFilters({ sort: 'recent' })).toBe(false)
  })
})
