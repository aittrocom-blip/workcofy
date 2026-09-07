import { describe, expect, it } from 'vitest'
import { buildSpaceQueryDescriptor } from './spaceQueryBuilder'

describe('buildSpaceQueryDescriptor', () => {
  it('returns no filters for empty input', () => {
    expect(buildSpaceQueryDescriptor({})).toEqual({ eqFilters: [], categoryIn: null, searchTerm: null })
  })

  it('adds an eq filter for district', () => {
    const result = buildSpaceQueryDescriptor({ district: 'miraflores' })
    expect(result.eqFilters).toEqual([{ column: 'district', value: 'miraflores' }])
  })

  it('adds an eq filter for country', () => {
    const result = buildSpaceQueryDescriptor({ country: 'cl' })
    expect(result.eqFilters).toEqual([{ column: 'country', value: 'cl' }])
  })

  it('sets categoryIn for a single category (e.g. from /espacios/[categoria])', () => {
    const result = buildSpaceQueryDescriptor({ district: 'barranco', category: ['cafe'] })
    expect(result.eqFilters).toEqual([{ column: 'district', value: 'barranco' }])
    expect(result.categoryIn).toEqual(['cafe'])
  })

  it('sets categoryIn for several categories (multi-select "Espacio" filter)', () => {
    expect(buildSpaceQueryDescriptor({ category: ['cafe', 'work_cafe'] }).categoryIn).toEqual(['cafe', 'work_cafe'])
  })

  it('treats an empty category array as no filter', () => {
    expect(buildSpaceQueryDescriptor({ category: [] }).categoryIn).toBeNull()
  })

  it('trims and includes a search term', () => {
    expect(buildSpaceQueryDescriptor({ search: '  neira  ' }).searchTerm).toBe('neira')
  })

  it('treats a blank search string as no search', () => {
    expect(buildSpaceQueryDescriptor({ search: '   ' }).searchTerm).toBeNull()
  })
})
