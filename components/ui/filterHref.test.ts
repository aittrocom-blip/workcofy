import { describe, expect, it } from 'vitest'
import { filterHref } from './filterHref'

describe('filterHref', () => {
  it('sets a param, keeps the others, and resets page', () => {
    expect(filterHref('/oportunidades', { tipo: 'empleo', page: '3' }, 'nivel', 'junior')).toBe('/oportunidades?tipo=empleo&nivel=junior')
  })
  it('removes a param when value is null', () => {
    expect(filterHref('/oportunidades', { tipo: 'empleo' }, 'tipo', null)).toBe('/oportunidades')
  })
})
