import { describe, expect, it } from 'vitest'
import { parseDiscoveryFilters, serializeDiscoveryFilters } from './discoveryFilters'

describe('discoveryFilters', () => {
  it('parses defaults from empty params', () => {
    expect(parseDiscoveryFilters(new URLSearchParams())).toEqual({
      country: null,
      district: null,
      category: null,
      search: null,
      sort: 'distance',
      openNow: false,
      verifiedOnly: false,
    })
  })

  it('parses all fields from params', () => {
    const params = new URLSearchParams(
      'country=cl&district=barranco&category=cafe&q=neira&sort=rating&open=1&verified=1'
    )
    expect(parseDiscoveryFilters(params)).toEqual({
      country: 'cl',
      district: 'barranco',
      category: 'cafe',
      search: 'neira',
      sort: 'rating',
      openNow: true,
      verifiedOnly: true,
    })
  })

  it('round-trips through serialize then parse', () => {
    const state = {
      country: 'pe',
      district: 'miraflores',
      category: null,
      search: 'café',
      sort: 'open_now' as const,
    }
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters(state)))
    expect(parsed.country).toBe('pe')
    expect(parsed.district).toBe('miraflores')
    expect(parsed.search).toBe('café')
    expect(parsed.sort).toBe('open_now')
  })
})
