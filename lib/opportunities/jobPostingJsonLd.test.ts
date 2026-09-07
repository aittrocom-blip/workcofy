import { describe, expect, it } from 'vitest'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import { buildJobPostingJsonLd } from './jobPostingJsonLd'

function opportunity(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'qa-tecnico-acme-lima',
    title: 'QA Técnico',
    company: 'Acme',
    company_logo_url: null,
    type: 'empleo',
    modality: 'presencial',
    is_ai: false,
    area: 'ingenieria',
    experience_level: 'junior',
    location: 'Lima, Perú',
    country: 'pe',
    language: 'es',
    salary_text: null,
    summary: 'Resumen breve.',
    description: 'Descripción completa del puesto.',
    tags: [],
    source: 'getonboard',
    source_url: 'https://www.getonbrd.com/jobs/qa-tecnico-acme-lima',
    external_id: 'qa-tecnico-acme-lima',
    published_at: '2026-09-01T00:00:00.000Z',
    expires_at: '2026-10-16T00:00:00.000Z',
    status: 'published',
    click_count: 0,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildJobPostingJsonLd', () => {
  it('maps an on-site job to a Place with country and locality', () => {
    const json = buildJobPostingJsonLd(opportunity(), 'https://workcofy.com')
    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'QA Técnico',
      employmentType: 'FULL_TIME',
      hiringOrganization: { '@type': 'Organization', name: 'Acme' },
      jobLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressCountry: 'PE', addressLocality: 'Lima, Perú' },
      },
      validThrough: '2026-10-16T00:00:00.000Z',
      url: 'https://workcofy.com/oportunidades/qa-tecnico-acme-lima',
    })
    expect(json.jobLocationType).toBeUndefined()
  })

  it('maps a remote job to TELECOMMUTE with applicantLocationRequirements when the country is known', () => {
    const json = buildJobPostingJsonLd(opportunity({ modality: 'remoto', country: 'cl' }), 'https://workcofy.com')
    expect(json).toMatchObject({
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'Country', name: 'Chile' },
    })
    expect(json.jobLocation).toBeUndefined()
  })

  it('omits applicantLocationRequirements when the country is unknown, and validThrough when there is no expiry', () => {
    const json = buildJobPostingJsonLd(opportunity({ modality: 'remoto', country: null, expires_at: null }), 'https://workcofy.com')
    expect(json.applicantLocationRequirements).toBeUndefined()
    expect(json.validThrough).toBeUndefined()
  })

  it('maps freelance/proyecto to CONTRACTOR and practicas to INTERN', () => {
    expect(buildJobPostingJsonLd(opportunity({ type: 'freelance' }), 'https://x').employmentType).toBe('CONTRACTOR')
    expect(buildJobPostingJsonLd(opportunity({ type: 'proyecto' }), 'https://x').employmentType).toBe('CONTRACTOR')
    expect(buildJobPostingJsonLd(opportunity({ type: 'practicas' }), 'https://x').employmentType).toBe('INTERN')
  })

  it('includes the company logo only when present', () => {
    const withLogo = buildJobPostingJsonLd(opportunity({ company_logo_url: 'https://cdn/logo.png' }), 'https://x')
    expect(withLogo.hiringOrganization).toMatchObject({ logo: 'https://cdn/logo.png' })
    const withoutLogo = buildJobPostingJsonLd(opportunity(), 'https://x')
    expect((withoutLogo.hiringOrganization as Record<string, unknown>).logo).toBeUndefined()
  })
})
