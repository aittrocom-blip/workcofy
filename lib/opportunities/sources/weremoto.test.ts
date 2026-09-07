import { describe, expect, it } from 'vitest'
import {
  buildLocation,
  extractJobPostingJsonLd,
  extractJobSlugs,
  formatSalary,
  inferCountry,
  isRemoteWeRemotoJob,
  mapArea,
  mapEmploymentType,
  mapLevel,
  mapWeRemotoJob,
  type WeRemotoJobPosting,
} from './weremoto'

function posting(overrides: Partial<WeRemotoJobPosting> = {}): WeRemotoJobPosting {
  return {
    title: 'Desarrollador Full-Stack',
    description: 'Buscamos una persona full-stack con experiencia en Node.js, React y PostgreSQL.',
    datePosted: '2026-09-05T19:41:20.518011Z',
    validThrough: '2026-10-05T19:41:20.518011Z',
    employmentType: 'Full Time',
    hiringOrganization: { name: 'Cobrix', logo: 'https://storage.googleapis.com/weremoto-prod/logo.png' },
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: { name: 'Remoto LATAM' },
    ...overrides,
  }
}

describe('extractJobPostingJsonLd', () => {
  it('parses a JobPosting script tag out of a full HTML page', () => {
    const html = `<html><body><script type="application/ld+json">${JSON.stringify({
      '@type': 'JobPosting',
      title: 'Desarrollador Full-Stack',
      description: 'desc',
      datePosted: '2026-09-05T19:41:20.518011Z',
    })}</script></body></html>`
    expect(extractJobPostingJsonLd(html)).toMatchObject({ title: 'Desarrollador Full-Stack' })
  })

  it('returns null when there is no JSON-LD or it is not a JobPosting', () => {
    expect(extractJobPostingJsonLd('<html><body>no json-ld here</body></html>')).toBeNull()
    const wrongType = `<script type="application/ld+json">${JSON.stringify({ '@type': 'Organization' })}</script>`
    expect(extractJobPostingJsonLd(wrongType)).toBeNull()
    expect(extractJobPostingJsonLd('<script type="application/ld+json">not json</script>')).toBeNull()
  })
})

describe('extractJobSlugs', () => {
  it('pulls unique job-posts slugs out of listing page links, ignoring duplicates', () => {
    const html = `
      <a href="/job-posts/id-desarrollador-full-stack-cobrix">A</a>
      <a href="/job-posts/id-asistente-administrativo-aprendika">B</a>
      <a href="/job-posts/id-desarrollador-full-stack-cobrix">A again (Ver trabajo button)</a>
    `
    expect(extractJobSlugs(html)).toEqual([
      'id-desarrollador-full-stack-cobrix',
      'id-asistente-administrativo-aprendika',
    ])
  })

  it('returns an empty array when there are no job links', () => {
    expect(extractJobSlugs('<html><body>nothing</body></html>')).toEqual([])
  })
})

describe('isRemoteWeRemotoJob', () => {
  it('keeps TELECOMMUTE, drops anything else', () => {
    expect(isRemoteWeRemotoJob(posting())).toBe(true)
    expect(isRemoteWeRemotoJob(posting({ jobLocationType: 'ON_SITE' }))).toBe(false)
    expect(isRemoteWeRemotoJob(posting({ jobLocationType: undefined }))).toBe(false)
  })
})

describe('field mappers', () => {
  it('maps employment type', () => {
    expect(mapEmploymentType('Full Time')).toBe('empleo')
    expect(mapEmploymentType('Freelance')).toBe('freelance')
    expect(mapEmploymentType('Internship')).toBe('practicas')
    expect(mapEmploymentType('Contract')).toBe('proyecto')
    expect(mapEmploymentType(undefined)).toBe('empleo')
  })

  it('infers area from title/description keywords', () => {
    expect(mapArea('Desarrollador Full-Stack', 'Node.js y React')).toBe('ingenieria')
    expect(mapArea('Ejecutivo de Marketing', '')).toBe('marketing')
    expect(mapArea('Asesor de Ventas', '')).toBe('ventas')
    expect(mapArea('Algo sin categoría clara', '')).toBe('otros')
  })

  it('infers experience level from title/description', () => {
    expect(mapLevel('Senior Backend Engineer', '')).toBe('senior')
    expect(mapLevel('Junior Developer', '')).toBe('junior')
    expect(mapLevel('Backend Engineer', '')).toBeNull()
  })

  it('infers country from applicantLocationRequirements when it names a real country', () => {
    expect(inferCountry(posting({ applicantLocationRequirements: { name: 'Argentina' } }))).toBe('ar')
    expect(inferCountry(posting({ applicantLocationRequirements: { name: 'Remoto LATAM' } }))).toBeNull()
    expect(inferCountry(posting({ applicantLocationRequirements: undefined }))).toBeNull()
  })

  it('builds a "Remoto · <requirement>" location label, falling back to plain "Remoto"', () => {
    expect(buildLocation(posting())).toBe('Remoto · Remoto LATAM')
    expect(buildLocation(posting({ applicantLocationRequirements: undefined }))).toBe('Remoto')
  })

  it('formats salary only when baseSalary actually has a value', () => {
    expect(formatSalary(posting())).toBeNull()
    expect(
      formatSalary(posting({ baseSalary: { currency: 'USD', value: { minValue: 1000, maxValue: 1500 } } }))
    ).toBe('USD 1000 – 1500')
    expect(formatSalary(posting({ baseSalary: { currency: 'USD', value: { value: 1200 } } }))).toBe('USD 1200')
  })
})

describe('mapWeRemotoJob', () => {
  it('produces a complete insert row', () => {
    const row = mapWeRemotoJob('id-desarrollador-full-stack-cobrix', posting(), 'https://www.weremoto.com/job-posts/id-desarrollador-full-stack-cobrix')
    expect(row).toMatchObject({
      slug: 'id-desarrollador-full-stack-cobrix',
      title: 'Desarrollador Full-Stack',
      company: 'Cobrix',
      company_logo_url: 'https://storage.googleapis.com/weremoto-prod/logo.png',
      type: 'empleo',
      modality: 'remoto',
      area: 'ingenieria',
      location: 'Remoto · Remoto LATAM',
      country: null,
      language: 'es',
      source: 'weremoto',
      source_url: 'https://www.weremoto.com/job-posts/id-desarrollador-full-stack-cobrix',
      external_id: 'id-desarrollador-full-stack-cobrix',
      status: 'published',
    })
    expect(row.published_at).toBe('2026-09-05T19:41:20.518Z')
    expect(row.expires_at).toBe('2026-10-05T19:41:20.518Z')
  })

  it('falls back to "Empresa confidencial" when no company name is given', () => {
    const row = mapWeRemotoJob('id-x', posting({ hiringOrganization: undefined }), 'https://www.weremoto.com/job-posts/id-x')
    expect(row.company).toBe('Empresa confidencial')
    expect(row.company_logo_url).toBeNull()
  })
})
