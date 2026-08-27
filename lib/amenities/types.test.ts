import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, averageKnownAmenities, parseAmenities } from './types'

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

describe('parseAmenities', () => {
  it('returns an all-null shape for an empty object (the real DB default today)', () => {
    expect(parseAmenities({})).toEqual(DEFAULT_AMENITIES)
  })

  it('returns an all-null shape for null or undefined', () => {
    expect(parseAmenities(null)).toEqual(DEFAULT_AMENITIES)
    expect(parseAmenities(undefined)).toEqual(DEFAULT_AMENITIES)
  })

  it('preserves known booleans and nulls out anything missing or non-boolean', () => {
    const raw = { para_trabajar: { wifi: true, enchufes: 'yes' }, servicios: { banos: false } }
    const result = parseAmenities(raw)
    expect(result.para_trabajar.wifi).toBe(true)
    expect(result.para_trabajar.enchufes).toBeNull()
    expect(result.para_trabajar.mesas_comodas).toBeNull()
    expect(result.servicios.banos).toBe(false)
    expect(result.para_llamadas).toEqual(DEFAULT_AMENITIES.para_llamadas)
  })
})
