import { describe, expect, it } from 'vitest'
import { buildCourseQueryDescriptor, courseFiltersToParams, parseCourseFilters } from './queryBuilder'

describe('parseCourseFilters', () => {
  it('reads Spanish params', () => {
    expect(
      parseCourseFilters({
        categoria: 'herramientas',
        area: 'marketing',
        herramienta: 'claude',
        nivel: 'principiante',
        precio: 'gratis',
        idioma: 'es',
        certificado: '1',
      })
    ).toEqual({
      category: 'herramientas',
      area: 'marketing',
      tool: 'claude',
      level: 'principiante',
      price: 'gratis',
      language: 'es',
      certificate: true,
    })
    expect(parseCourseFilters({}).certificate).toBeNull()
  })
})

describe('courseFiltersToParams', () => {
  it('round-trips', () => {
    expect(courseFiltersToParams({ category: 'ia_desde_cero', certificate: true })).toEqual({ categoria: 'ia_desde_cero', certificado: '1' })
  })
})

describe('buildCourseQueryDescriptor', () => {
  it('keeps only valid values', () => {
    expect(
      buildCourseQueryDescriptor({ category: 'nope', area: 'ventas', tool: 'gemini', level: 'x', price: 'pago', language: 'multi', certificate: true })
    ).toEqual({
      eqFilters: [
        { column: 'area', value: 'ventas' },
        { column: 'tool', value: 'gemini' },
        { column: 'price', value: 'pago' },
        { column: 'language', value: 'multi' },
      ],
      certificate: true,
    })
  })
})
