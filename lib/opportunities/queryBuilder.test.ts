import { describe, expect, it } from 'vitest'
import {
  hasActiveOpportunityFilters,
  OPPORTUNITY_PAGE_SIZE,
  buildOpportunityQueryDescriptor,
  opportunityFiltersToParams,
  parseOpportunityFilters,
} from './queryBuilder'

describe('parseOpportunityFilters', () => {
  it('reads the Spanish URL params into filter fields', () => {
    expect(
      parseOpportunityFilters({
        q: 'react',
        tipo: 'freelance',
        modalidad: 'remoto',
        nivel: 'junior',
        area: 'diseno',
        pais: 'pe',
        ia: '1',
        page: '2',
      })
    ).toEqual({ q: 'react', type: 'freelance', modality: 'remoto', level: 'junior', area: 'diseno', country: 'pe', ai: true, sort: 'recent', page: 2 })
  })
  it('defaults to page 1, null ai, and takes the first value of repeated params', () => {
    expect(parseOpportunityFilters({ tipo: ['empleo', 'freelance'], page: 'abc' })).toMatchObject({ type: 'empleo', ai: null, page: 1 })
    expect(parseOpportunityFilters({ ia: '0' }).ai).toBe(false)
  })
})

describe('opportunityFiltersToParams', () => {
  it('round-trips and drops empty/default values', () => {
    expect(opportunityFiltersToParams({ q: 'x', type: 'empleo', ai: false, page: 1 })).toEqual({ q: 'x', tipo: 'empleo', ia: '0' })
    expect(opportunityFiltersToParams({ page: 3, ai: null })).toEqual({ page: '3' })
  })

  it('preserves the sort order in the URL only when it is non-default', () => {
    expect(opportunityFiltersToParams({ q: 'x', sort: 'recent', page: 1 })).toEqual({ q: 'x' })
    expect(opportunityFiltersToParams({ sort: 'relevant', page: 3 })).toEqual({ orden: 'relevant', page: '3' })
  })
})

describe('buildOpportunityQueryDescriptor', () => {
  it('keeps only valid enum values and computes the range', () => {
    const d = buildOpportunityQueryDescriptor({
      type: 'freelance',
      modality: 'nope',
      level: 'senior',
      area: 'marketing',
      country: 'pe',
      ai: true,
      sort: 'relevant',
      page: 2,
      q: '  ux  ',
    })
    expect(d.eqFilters).toEqual([
      { column: 'type', value: 'freelance' },
      { column: 'experience_level', value: 'senior' },
      { column: 'area', value: 'marketing' },
      { column: 'country', value: 'pe' },
    ])
    expect(d.isAi).toBe(true)
    expect(d.searchTerm).toBe('ux')
    expect(d.sort).toBe('relevant')
    expect(d.page).toBe(2)
    expect(d.from).toBe(OPPORTUNITY_PAGE_SIZE)
    expect(d.to).toBe(OPPORTUNITY_PAGE_SIZE * 2 - 1)
  })
  it('treats empty filters as page 1 with no constraints', () => {
    expect(buildOpportunityQueryDescriptor({})).toEqual({
      eqFilters: [],
      isAi: null,
      searchTerm: null,
      sort: 'recent',
      page: 1,
      from: 0,
      to: OPPORTUNITY_PAGE_SIZE - 1,
    })
  })
})

describe('hasActiveOpportunityFilters', () => {
  it('ignores filters the route already bakes in, and sort/page', () => {
    expect(hasActiveOpportunityFilters({ modality: 'remoto' }, { modality: 'remoto' })).toBe(false)
    expect(hasActiveOpportunityFilters({ modality: 'remoto', level: 'senior' }, { modality: 'remoto' })).toBe(true)
    expect(hasActiveOpportunityFilters({ sort: 'relevant', page: 2 })).toBe(false)
    expect(hasActiveOpportunityFilters({ ai: true }, { ai: true })).toBe(false)
    expect(hasActiveOpportunityFilters({})).toBe(false)
  })
})
