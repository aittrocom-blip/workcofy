import { describe, expect, it } from 'vitest'
import { parseDiscoveryFilters, serializeDiscoveryFilters } from './discoveryFilters'

describe('discoveryFilters', () => {
  it('parses defaults from empty params', () => {
    expect(parseDiscoveryFilters(new URLSearchParams())).toEqual({
      country: null,
      district: null,
      category: [],
      search: null,
      sort: 'distance',
      openNow: true,
      open24h: false,
      openBetween: null,
      verifiedOnly: false,
    })
  })

  it('parses an explicit open=0 as turned off, not the default', () => {
    expect(parseDiscoveryFilters(new URLSearchParams('open=0')).openNow).toBe(false)
  })

  it('parses a comma-separated category list', () => {
    expect(parseDiscoveryFilters(new URLSearchParams('category=cafe,work_cafe')).category).toEqual([
      'cafe',
      'work_cafe',
    ])
    expect(parseDiscoveryFilters(new URLSearchParams()).category).toEqual([])
  })

  it('parses all fields from params', () => {
    const params = new URLSearchParams(
      'country=cl&district=barranco&category=cafe&q=neira&sort=rating&open=1&verified=1'
    )
    expect(parseDiscoveryFilters(params)).toEqual({
      country: 'cl',
      district: 'barranco',
      category: ['cafe'],
      search: 'neira',
      sort: 'rating',
      openNow: true,
      open24h: false,
      openBetween: null,
      verifiedOnly: true,
    })
  })

  it('parses open24h=1 from params', () => {
    expect(parseDiscoveryFilters(new URLSearchParams('open24h=1')).open24h).toBe(true)
    expect(parseDiscoveryFilters(new URLSearchParams()).open24h).toBe(false)
  })

  it('parses an open-hours time range from openFrom/openTo params', () => {
    const params = new URLSearchParams('openFrom=09:00&openTo=18:00')
    expect(parseDiscoveryFilters(params).openBetween).toEqual({ start: '09:00', end: '18:00' })
  })

  it('round-trips a category list through serialize then parse', () => {
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters({ category: ['cafe', 'hotel'] })))
    expect(parsed.category).toEqual(['cafe', 'hotel'])
  })

  it('omits the category param entirely when the list is empty', () => {
    expect(serializeDiscoveryFilters({ category: [] })).toBe('')
  })

  it('round-trips an open-hours time range through serialize then parse', () => {
    const state = {
      country: null,
      district: null,
      category: [],
      search: null,
      sort: 'distance' as const,
      openNow: false,
      open24h: false,
      openBetween: { start: '09:00', end: '18:00' },
      verifiedOnly: false,
    }
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters(state)))
    expect(parsed.openBetween).toEqual({ start: '09:00', end: '18:00' })
  })

  it('round-trips open24h through serialize then parse', () => {
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters({ open24h: true })))
    expect(parsed.open24h).toBe(true)
  })

  it('round-trips through serialize then parse', () => {
    const state = {
      country: 'pe',
      district: 'miraflores',
      category: [],
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
