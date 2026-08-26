import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserLocation } from './useUserLocation'
import { DISTRICT_CENTROIDS } from '@/lib/districts'

describe('useUserLocation', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { geolocation: undefined })
  })

  it('starts idle with the Miraflores fallback coordinate', () => {
    const { result } = renderHook(() => useUserLocation())
    expect(result.current.status).toBe('idle')
    expect(result.current.coordinate).toEqual(DISTRICT_CENTROIDS.miraflores)
  })

  it('reports unavailable when geolocation is not supported', () => {
    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())
    expect(result.current.status).toBe('unavailable')
  })

  it('sets granted status and the real coordinate on success', () => {
    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: -12.05, longitude: -77.03 } })
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())

    expect(result.current.status).toBe('granted')
    expect(result.current.coordinate).toEqual({ lat: -12.05, lng: -77.03 })
    expect(result.current.isFallback).toBe(false)
  })

  it('falls back to denied status and the Miraflores coordinate on error', () => {
    const getCurrentPosition = vi.fn((_success, error) => error({ code: 1 }))
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())

    expect(result.current.status).toBe('denied')
    expect(result.current.coordinate).toEqual(DISTRICT_CENTROIDS.miraflores)
  })
})
