import { describe, expect, it, afterEach, vi } from 'vitest'
import { hasGoogleMapsKey } from './MapView'

describe('hasGoogleMapsKey', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false when no key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    expect(hasGoogleMapsKey()).toBe(false)
  })

  it('is true when a key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'test-key')
    expect(hasGoogleMapsKey()).toBe(true)
  })
})
