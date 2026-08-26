import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS, ACTIVE_CATEGORY_VALUES } from './categories'

describe('categories', () => {
  it('marks only cafe and work_cafe as active', () => {
    expect(ACTIVE_CATEGORY_VALUES).toEqual(['cafe', 'work_cafe'])
  })

  it('includes reserved future categories as inactive', () => {
    const coworking = CATEGORY_OPTIONS.find((c) => c.value === 'coworking')
    expect(coworking?.active).toBe(false)
  })
})
