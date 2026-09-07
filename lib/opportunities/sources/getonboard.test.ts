import { describe, expect, it } from 'vitest'
import {
  GETONBOARD_MAX_AGE_DAYS,
  countryCodeFor,
  formatSalary,
  isFresh,
  mapArea,
  mapGetOnBoardJob,
  mapLevel,
  mapModality,
  mapType,
  shouldKeep,
  type GetOnBoardJob,
} from './getonboard'

const now = new Date('2026-09-05T12:00:00Z')

function job(overrides: Partial<GetOnBoardJob['attributes']> = {}, id = 'qa-tecnico-acme-lima'): GetOnBoardJob {
  return {
    id,
    type: 'job',
    links: { public_url: `https://www.getonbrd.com/jobs/${id}` },
    attributes: {
      title: 'QA Técnico',
      description_headline: 'Requisitos',
      description: '<p>Experiencia en <b>testing</b>.</p>',
      functions_headline: 'Funciones',
      functions: '<ul><li>Probar</li><li>Reportar</li></ul>',
      desirable_headline: '',
      desirable: '',
      remote: false,
      remote_modality: 'hybrid',
      countries: ['Peru'],
      lang: 'es',
      category_name: 'SysAdmin / DevOps / QA',
      min_salary: 1500,
      max_salary: 2000,
      published_at: Math.floor(now.getTime() / 1000) - 2 * 86_400,
      modality: { data: { attributes: { name: 'Full time', locale_key: 'full_time' } } },
      seniority: { data: { attributes: { name: 'Junior', locale_key: 'junior' } } },
      tags: { data: [{ attributes: { name: 'Selenium' } }, { attributes: { name: 'AI Tools' } }] },
      company: { data: { attributes: { name: 'Acme', logo: 'https://cdn/logo.png', web: 'https://acme.pe' } } },
      ...overrides,
    },
  }
}

describe('field mappers', () => {
  it('maps modality/type/level/area/country', () => {
    expect(mapType('freelance')).toBe('freelance')
    expect(mapType('internship')).toBe('practicas')
    expect(mapType('part_time')).toBe('empleo')
    expect(mapType(null)).toBe('empleo')
    expect(mapModality('fully_remote')).toBe('remoto')
    expect(mapModality('remote_local')).toBe('remoto')
    expect(mapModality('hybrid')).toBe('hibrido')
    expect(mapModality('no_remote')).toBe('presencial')
    expect(mapLevel('no_experience')).toBe('junior')
    expect(mapLevel('semi_senior')).toBe('mid')
    expect(mapLevel('expert')).toBe('lead')
    expect(mapLevel(null)).toBeNull()
    expect(mapArea('Digital Marketing')).toBe('marketing')
    expect(mapArea('People & HR')).toBe('rrhh')
    expect(mapArea('Machine Learning & AI')).toBe('datos')
    expect(mapArea('Product, Innovation & Agile')).toBe('producto')
    expect(mapArea('Customer Support')).toBe('operaciones')
    expect(mapArea('Hardware / Electronics')).toBe('ingenieria')
    expect(mapArea('Something new')).toBe('otros')
    expect(countryCodeFor('Perú')).toBe('pe')
    expect(countryCodeFor('Mexico')).toBe('mx')
    expect(countryCodeFor('Remote')).toBeNull()
  })
  it('formats salaries in USD', () => {
    expect(formatSalary(1500, 2000)).toBe('USD 1,500 – 2,000')
    expect(formatSalary(1500, null)).toBe('Desde USD 1,500')
    expect(formatSalary(null, 2000)).toBe('Hasta USD 2,000')
    expect(formatSalary(null, null)).toBeNull()
  })
})

describe('shouldKeep / isFresh', () => {
  it('keeps only remote jobs, dropping on-site and hybrid regardless of country', () => {
    expect(shouldKeep(job())).toBe(false)
    expect(shouldKeep(job({ remote_modality: 'fully_remote', countries: ['Remote'] }))).toBe(true)
    expect(shouldKeep(job({ remote_modality: 'no_remote', countries: ['United States'] }))).toBe(false)
    expect(shouldKeep(job({ remote_modality: 'hybrid', countries: ['España'] }))).toBe(false)
    expect(shouldKeep(job({ remote_modality: 'remote_local', countries: ['Peru'] }))).toBe(true)
  })
  it('drops jobs older than the max age', () => {
    expect(isFresh(job(), now)).toBe(true)
    expect(isFresh(job({ published_at: Math.floor(now.getTime() / 1000) - 60 * 86_400 }), now)).toBe(false)
  })
})

describe('mapGetOnBoardJob', () => {
  it('produces a complete insert row', () => {
    const row = mapGetOnBoardJob(job(), now)
    expect(row).toMatchObject({
      slug: 'qa-tecnico-acme-lima',
      title: 'QA Técnico',
      company: 'Acme',
      company_logo_url: 'https://cdn/logo.png',
      type: 'empleo',
      modality: 'hibrido',
      is_ai: true,
      area: 'ingenieria',
      experience_level: 'junior',
      location: 'Perú',
      country: 'pe',
      language: 'es',
      salary_text: 'USD 1,500 – 2,000',
      tags: ['selenium', 'ai tools'],
      source: 'getonboard',
      source_url: 'https://www.getonbrd.com/jobs/qa-tecnico-acme-lima',
      external_id: 'qa-tecnico-acme-lima',
      status: 'published',
    })
    expect(row.description).toBe('Requisitos\nExperiencia en testing.\n\nFunciones\n• Probar\n• Reportar')
    expect(row.summary).toBe('• Probar • Reportar')
    expect(new Date(row.expires_at!).getTime() - new Date(row.published_at).getTime()).toBe(
      GETONBOARD_MAX_AGE_DAYS * 86_400_000
    )
  })
  it('labels remote jobs and falls back when the company is missing', () => {
    const row = mapGetOnBoardJob(
      job({ remote_modality: 'fully_remote', countries: ['Remote', 'Chile'], company: { data: null }, lang: 'lang_not_specified' }),
      now
    )
    expect(row.location).toBe('Remoto · Chile')
    expect(row.country).toBe('cl')
    expect(row.company).toBe('Empresa confidencial')
    expect(row.company_logo_url).toBeNull()
    expect(row.language).toBeNull()
  })
})
