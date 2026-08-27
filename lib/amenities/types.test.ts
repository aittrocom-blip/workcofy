import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, averageKnownAmenities } from './types'

describe('DEFAULT_AMENITIES', () => {
  it('has all three groups with every leaf null', () => {
    expect(DEFAULT_AMENITIES.para_trabajar).toEqual({
      wifi: null, enchufes: null, mesas_comodas: null, iluminacion: null,
    })
    expect(DEFAULT_AMENITIES.para_llamadas).toEqual({
      videollamadas: null, zona_tranquila: null, booth: null,
    })
    expect(DEFAULT_AMENITIES.servicios).toEqual({
      cafe: null, agua: null, banos: null, impresiones: null, pizarra: null, sala_reuniones: null,
    })
  })
})

describe('averageKnownAmenities', () => {
  it('returns null when every leaf is unknown', () => {
    expect(averageKnownAmenities({ a: null, b: null })).toBeNull()
  })

  it('ignores null leaves and averages only known ones', () => {
    expect(averageKnownAmenities({ a: true, b: null, c: false })).toBe(50)
  })

  it('returns 100 when every known leaf is true', () => {
    expect(averageKnownAmenities({ a: true, b: true })).toBe(100)
  })

  it('returns 0 when every known leaf is false', () => {
    expect(averageKnownAmenities({ a: false, b: false })).toBe(0)
  })
})
