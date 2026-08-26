import { describe, expect, it } from 'vitest'
import { parseDiscoveryFilters, serializeDiscoveryFilters } from './discoveryFilters'

describe('discoveryFilters', () => {
  it('parses defaults from empty params', () => {
    expect(parseDiscoveryFilters(new URLSearchParams())).toEqual({
      district: null,
      category: null,
      search: null,
      sort: 'rating',
    })
  })

  it('parses all fields from params', () => {
    const params = new URLSearchParams('district=barranco&category=cafe&q=neira&sort=distance')
    expect(parseDiscoveryFilters(params)).toEqual({
      district: 'barranco',
      category: 'cafe',
      search: 'neira',
      sort: 'distance',
    })
  })

  it('round-trips through serialize then parse', () => {
    const state = { district: 'miraflores', category: null, search: 'café', sort: 'open_now' as const }
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters(state)))
    expect(parsed.district).toBe('miraflores')
    expect(parsed.search).toBe('café')
    expect(parsed.sort).toBe('open_now')
  })
})
