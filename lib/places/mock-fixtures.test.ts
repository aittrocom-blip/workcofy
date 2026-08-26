import { describe, expect, it } from 'vitest'
import { buildMockSpaceFixtures } from './mock-fixtures'
import { SEED_TARGETS } from './seedTargets'

describe('buildMockSpaceFixtures', () => {
  it('produces one fixture per seed target', () => {
    expect(buildMockSpaceFixtures()).toHaveLength(SEED_TARGETS.length)
  })

  it('produces unique slugs', () => {
    const fixtures = buildMockSpaceFixtures()
    expect(new Set(fixtures.map((f) => f.slug)).size).toBe(fixtures.length)
  })

  it('only uses the three launch district values', () => {
    const valid = ['miraflores', 'san_isidro', 'barranco']
    buildMockSpaceFixtures().forEach((fixture) => {
      expect(valid).toContain(fixture.district)
    })
  })

  it('assigns coordinates to every fixture', () => {
    buildMockSpaceFixtures().forEach((fixture) => {
      expect(fixture.latitude).not.toBeNull()
      expect(fixture.longitude).not.toBeNull()
    })
  })
})
