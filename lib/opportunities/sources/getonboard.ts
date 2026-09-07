// Pure mapping from GetOnBoard's public API (verified 2026-09-05, no auth:
// GET https://www.getonbrd.com/api/v0/categories/{id}/jobs?per_page=100&page=N
//     &expand=["company","modality","seniority","tags"])
// to our opportunities row. Fetching lives in getonboardClient.ts so this
// file stays unit-testable.
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import type { ExperienceLevel, OpportunityModality, OpportunityType } from '@/lib/opportunities/constants'
import { OPPORTUNITY_COUNTRIES } from '@/lib/opportunities/constants'
import type { ProfessionValue } from '@/lib/professions'
import { classifyAi } from '@/lib/opportunities/classifyAi'
import { stripHtml } from '@/lib/text/stripHtml'
import { truncateWords } from '@/lib/text/truncate'

export interface GetOnBoardJob {
  id: string
  type: 'job'
  links: { public_url: string }
  attributes: {
    title: string
    description_headline: string
    description: string
    functions_headline: string
    functions: string
    desirable_headline: string
    desirable: string
    remote: boolean
    remote_modality: string
    countries: string[]
    lang: string
    category_name: string
    min_salary: number | null
    max_salary: number | null
    published_at: number
    modality: { data: { attributes: { name: string; locale_key: string } } | null }
    seniority: { data: { attributes: { name: string; locale_key: string } } | null }
    tags: { data: { attributes?: { name: string } }[] }
    company: { data: { attributes: { name: string; logo: string | null; web: string | null } } | null }
  }
}

// From GET /api/v0/categories (2026-09-05).
export const GETONBOARD_CATEGORY_IDS = [
  'programming',
  'sysadmin-devops-qa',
  'data-science-analytics',
  'machine-learning-ai',
  'mobile-developer',
  'cybersecurity',
  'hardware-electronics',
  'design-ux',
  'digital-marketing',
  'advertising-media',
  'sales',
  'customer-support',
  'technical-support',
  'operations-management',
  'innovation-agile',
  'hr',
  'education-coaching',
  'other',
]

// Also the public-visibility window: expires_at (below) hides a listing
// past this age, though the row itself is never deleted. 4 weeks.
export const GETONBOARD_MAX_AGE_DAYS = 28
const DAY_MS = 86_400_000

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  peru: 'pe',
  perú: 'pe',
  chile: 'cl',
  mexico: 'mx',
  méxico: 'mx',
  colombia: 'co',
  argentina: 'ar',
  uruguay: 'uy',
  ecuador: 'ec',
  bolivia: 'bo',
  paraguay: 'py',
  venezuela: 've',
  brasil: 'br',
  brazil: 'br',
  'costa rica': 'cr',
  panama: 'pa',
  panamá: 'pa',
  guatemala: 'gt',
  'dominican republic': 'do',
  'república dominicana': 'do',
  'el salvador': 'sv',
  honduras: 'hn',
  nicaragua: 'ni',
  españa: 'es',
  spain: 'es',
  'estados unidos': 'us',
  'united states': 'us',
  usa: 'us',
}

export function countryCodeFor(name: string): string | null {
  return COUNTRY_CODE_BY_NAME[name.trim().toLowerCase()] ?? null
}

function countryLabel(code: string, fallback: string): string {
  return OPPORTUNITY_COUNTRIES.find((c) => c.value === code)?.label ?? fallback
}

export function mapType(localeKey: string | null): OpportunityType {
  if (localeKey === 'freelance') return 'freelance'
  if (localeKey === 'internship') return 'practicas'
  return 'empleo'
}

export function mapModality(remoteModality: string): OpportunityModality {
  if (['fully_remote', 'remote_local', 'temporarily_remote'].includes(remoteModality)) return 'remoto'
  if (remoteModality === 'hybrid') return 'hibrido'
  return 'presencial'
}

export function mapLevel(localeKey: string | null): ExperienceLevel | null {
  switch (localeKey) {
    case 'no_experience':
    case 'junior':
      return 'junior'
    case 'semi_senior':
      return 'mid'
    case 'senior':
      return 'senior'
    case 'expert':
      return 'lead'
    default:
      return null
  }
}

export function mapArea(categoryName: string): ProfessionValue {
  const name = categoryName.toLowerCase()
  if (/programming|sysadmin|devops|mobile|cyber|hardware/.test(name)) return 'ingenieria'
  if (/marketing|advertising/.test(name)) return 'marketing'
  if (/sales/.test(name)) return 'ventas'
  if (/design/.test(name)) return 'diseno'
  if (/\bhr\b|people/.test(name)) return 'rrhh'
  if (/data|machine learning/.test(name)) return 'datos'
  if (/product|innovation/.test(name)) return 'producto'
  if (/operations|support|admin/.test(name)) return 'operaciones'
  if (/education/.test(name)) return 'educacion'
  return 'otros'
}

const USD = new Intl.NumberFormat('en-US')

export function formatSalary(min: number | null, max: number | null): string | null {
  if (min && max) return `USD ${USD.format(min)} – ${USD.format(max)}`
  if (min) return `Desde USD ${USD.format(min)}`
  if (max) return `Hasta USD ${USD.format(max)}`
  return null
}

function isRemote(job: GetOnBoardJob): boolean {
  return mapModality(job.attributes.remote_modality) === 'remoto'
}

// Remote is Workcofy's defining characteristic for Oportunidades — on-site
// and hybrid listings are dropped entirely regardless of country.
export function shouldKeep(job: GetOnBoardJob): boolean {
  return isRemote(job)
}

export function isFresh(job: GetOnBoardJob, now: Date): boolean {
  return now.getTime() - job.attributes.published_at * 1000 <= GETONBOARD_MAX_AGE_DAYS * DAY_MS
}

function primaryCountry(countries: string[]): string | null {
  for (const name of countries) {
    const code = countryCodeFor(name)
    if (code) return code
  }
  return null
}

function buildLocation(job: GetOnBoardJob): string {
  const named = job.attributes.countries
    .filter((name) => name.toLowerCase() !== 'remote')
    .map((name) => {
      const code = countryCodeFor(name)
      return code ? countryLabel(code, name) : name
    })
  if (isRemote(job)) return named.length ? `Remoto · ${named.join(', ')}` : 'Remoto'
  return named.length ? named.join(', ') : 'Sin ubicación'
}

function section(headline: string, html: string): string | null {
  const text = stripHtml(html)
  if (!text) return null
  const title = headline.trim()
  return title ? `${title}\n${text}` : text
}

function buildDescription(a: GetOnBoardJob['attributes']): string {
  return [
    section(a.description_headline, a.description),
    section(a.functions_headline, a.functions),
    section(a.desirable_headline, a.desirable),
  ]
    .filter((part): part is string => part !== null)
    .join('\n\n')
}

function buildSummary(a: GetOnBoardJob['attributes']): string | null {
  const text = stripHtml(a.functions || a.description || '')
  return text ? truncateWords(text, 200) : null
}

export function mapGetOnBoardJob(job: GetOnBoardJob, now: Date): OpportunityInsert {
  const a = job.attributes
  const company = a.company?.data?.attributes ?? null
  const tags = (a.tags?.data ?? [])
    .map((tag) => tag.attributes?.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase())
  const description = buildDescription(a)
  // Clamp future timestamps (clock skew on the source) to the run time.
  const publishedAt = new Date(Math.min(a.published_at * 1000, now.getTime()))
  return {
    slug: job.id,
    title: a.title.trim(),
    company: company?.name?.trim() || 'Empresa confidencial',
    company_logo_url: company?.logo || null,
    type: mapType(a.modality?.data?.attributes.locale_key ?? null),
    modality: mapModality(a.remote_modality),
    is_ai: classifyAi({ title: a.title, tags, description, categoryName: a.category_name }),
    area: mapArea(a.category_name),
    experience_level: mapLevel(a.seniority?.data?.attributes.locale_key ?? null),
    location: buildLocation(job),
    country: primaryCountry(a.countries),
    language: a.lang === 'es' || a.lang === 'en' ? a.lang : null,
    salary_text: formatSalary(a.min_salary, a.max_salary),
    summary: buildSummary(a),
    description,
    tags,
    source: 'getonboard',
    source_url: job.links.public_url,
    external_id: job.id,
    published_at: publishedAt.toISOString(),
    expires_at: new Date(publishedAt.getTime() + GETONBOARD_MAX_AGE_DAYS * DAY_MS).toISOString(),
    status: 'published',
  }
}
