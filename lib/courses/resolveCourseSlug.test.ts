import { describe, expect, it } from 'vitest'
import { resolveCourseSlug } from './resolveCourseSlug'

describe('resolveCourseSlug', () => {
  it('maps category slugs', () => {
    expect(resolveCourseSlug('herramientas')).toMatchObject({ title: 'Herramientas', filters: { category: 'herramientas' } })
  })
  it('maps ia-para-<area> to the profession category plus area', () => {
    expect(resolveCourseSlug('ia-para-marketing')).toMatchObject({
      title: 'IA para Marketing',
      filters: { category: 'ia_por_profesion', area: 'marketing' },
    })
    expect(resolveCourseSlug('ia-para-rrhh')?.title).toBe('IA para Recursos Humanos')
  })
  it('rejects unknown slugs', () => {
    expect(resolveCourseSlug('ia-para-astronautas')).toBeNull()
    expect(resolveCourseSlug('random')).toBeNull()
  })
})
