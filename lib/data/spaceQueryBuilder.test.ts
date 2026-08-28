import { describe, expect, it } from 'vitest'
import { buildSpaceQueryDescriptor } from './spaceQueryBuilder'

describe('buildSpaceQueryDescriptor', () => {
  it('returns no filters for empty input', () => {
    expect(buildSpaceQueryDescriptor({})).toEqual({ eqFilters: [], searchTerm: null })
  })

  it('adds an eq filter for district', () => {
    const result = buildSpaceQueryDescriptor({ district: 'miraflores' })
    expect(result.eqFilters).toEqual([{ column: 'district', value: 'miraflores' }])
  })

  it('adds eq filters for both district and category', () => {
    const result = buildSpaceQueryDescriptor({ district: 'barranco', category: 'cafe' })
    expect(result.eqFilters).toEqual([
      { column: 'district', value: 'barranco' },
      { column: 'category', value: 'cafe' },
    ])
  })

  it('adds an eq filter for country', () => {
    const result = buildSpaceQueryDescriptor({ country: 'cl' })
    expect(result.eqFilters).toEqual([{ column: 'country', value: 'cl' }])
  })

  it('trims and includes a search term', () => {
    expect(buildSpaceQueryDescriptor({ search: '  neira  ' }).searchTerm).toBe('neira')
  })

  it('treats a blank search string as no search', () => {
    expect(buildSpaceQueryDescriptor({ search: '   ' }).searchTerm).toBeNull()
  })
})
