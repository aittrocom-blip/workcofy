import { describe, expect, it } from 'vitest'
import { districtValueFromSlug, districtSlugFromValue, districtLabel, DISTRICTS } from './districts'

describe('districts', () => {
  it('lists exactly the three launch districts', () => {
    expect(DISTRICTS.map((d) => d.value)).toEqual(['miraflores', 'san_isidro', 'barranco'])
  })

  it('maps a hyphenated slug to its underscore db value', () => {
    expect(districtValueFromSlug('san-isidro')).toBe('san_isidro')
  })

  it('returns null for an unknown slug', () => {
    expect(districtValueFromSlug('surco')).toBeNull()
  })

  it('maps a db value back to its route slug', () => {
    expect(districtSlugFromValue('san_isidro')).toBe('san-isidro')
  })

  it('returns a human label for a db value', () => {
    expect(districtLabel('san_isidro')).toBe('San Isidro')
  })
})
