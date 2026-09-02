import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, averageKnownAmenities, parseAmenities } from './types'

describe('DEFAULT_AMENITIES', () => {
  it('defaults table-stakes amenities to true and everything else to null', () => {
    expect(DEFAULT_AMENITIES.para_trabajar).toEqual({
      wifi: true, wifi_rapido: null, enchufes: null, mesas_comodas: null, iluminacion: null,
      clima: null, senal_movil: null,
    })
    expect(DEFAULT_AMENITIES.para_llamadas).toEqual({
      videollamadas: null, zona_tranquila: null, booth: null, sala_reuniones: null,
    })
    expect(DEFAULT_AMENITIES.servicios).toEqual({
      cafe: true, agua: true, banos: true, comida: null, impresiones: null, pizarra: null,
      pantalla_tv: null, proyector: null, estacionamiento: null, terraza: null, pet_friendly: null,
      accesibilidad: null,
    })
  })

  it('defaults ambiente to null and tipo_espacio to an empty list', () => {
    expect(DEFAULT_AMENITIES.ambiente).toBeNull()
    expect(DEFAULT_AMENITIES.tipo_espacio).toEqual([])
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
  it('returns the default shape for an empty object (the real DB default today)', () => {
    expect(parseAmenities({})).toEqual(DEFAULT_AMENITIES)
  })

  it('returns the default shape for null or undefined', () => {
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

  it('accepts a valid ambiente value and rejects an invalid one', () => {
    expect(parseAmenities({ ambiente: 'tranquilo' }).ambiente).toBe('tranquilo')
    expect(parseAmenities({ ambiente: 'ruidoso' }).ambiente).toBeNull()
    expect(parseAmenities({ ambiente: 42 }).ambiente).toBeNull()
  })

  it('keeps only recognized tipo_espacio values, dropping anything else', () => {
    expect(parseAmenities({ tipo_espacio: ['sofa', 'mesa_grupal'] }).tipo_espacio).toEqual([
      'sofa', 'mesa_grupal',
    ])
    expect(parseAmenities({ tipo_espacio: ['sofa', 'jacuzzi'] }).tipo_espacio).toEqual(['sofa'])
    expect(parseAmenities({ tipo_espacio: 'sofa' }).tipo_espacio).toEqual([])
  })
})
