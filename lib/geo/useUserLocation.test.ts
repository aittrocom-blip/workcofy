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

  it('ignores stale callbacks from earlier requests when second request completes first', () => {
    // Store callbacks so we can invoke them out of order
    const callbacks: Array<{ success?: (pos: any) => void; error?: (err: any) => void }> = []

    const getCurrentPosition = vi.fn((success, error) => {
      callbacks.push({ success, error })
    })
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { result } = renderHook(() => useUserLocation())

    // First request
    act(() => result.current.requestLocation())
    const firstCallback = callbacks[0]

    // Second request
    act(() => result.current.requestLocation())
    const secondCallback = callbacks[1]

    // Resolve second request first with a specific coordinate
    const secondCoord = { latitude: -11.9, longitude: -77.0 }
    act(() => {
      secondCallback.success!({ coords: secondCoord })
    })

    expect(result.current.status).toBe('granted')
    expect(result.current.coordinate).toEqual({ lat: -11.9, lng: -77.0 })

    // Now resolve first request with a different coordinate
    // This should be ignored because it's stale
    const firstCoord = { latitude: -12.1, longitude: -77.1 }
    act(() => {
      firstCallback.success!({ coords: firstCoord })
    })

    // State should still reflect the second request's result
    expect(result.current.status).toBe('granted')
    expect(result.current.coordinate).toEqual({ lat: -11.9, lng: -77.0 })
  })
})
