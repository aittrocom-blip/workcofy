import { describe, expect, it } from 'vitest'
import { slugify, generateSpaceSlug, generateContentSlug } from './slug'

describe('slugify', () => {
  it('removes accents and lowercases', () => {
    expect(slugify('Café')).toBe('cafe')
  })

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('El Pan de la Chola — Pan & Café')).toBe('el-pan-de-la-chola-pan-cafe')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  Rue  ')).toBe('rue')
  })
})

describe('generateSpaceSlug', () => {
  it('joins the slugified name and district slug', () => {
    expect(generateSpaceSlug('Neira Café Lab', 'miraflores')).toBe('neira-cafe-lab-miraflores')
  })
})

describe('generateContentSlug', () => {
  it('joins slugified parts, skipping empties', () => {
    expect(generateContentSlug('Fundamentos de IA generativa', 'Microsoft Learn')).toBe('fundamentos-de-ia-generativa-microsoft-learn')
    expect(generateContentSlug('Claude 101', '')).toBe('claude-101')
  })
})
