// WeRemoto (https://www.weremoto.com) has no public API or feed — this
// module reads the schema.org JobPosting JSON-LD block every listing page
// already embeds for Google for Jobs/SEO. That's structured, intentionally
// public data (not screen-scraping visual markup), so it's far less fragile
// than parsing the page's HTML/CSS directly. Fetching lives in
// weremotoClient.ts so this file stays pure and unit-testable.
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import type { ExperienceLevel, OpportunityType } from '@/lib/opportunities/constants'
import type { ProfessionValue } from '@/lib/professions'
import { classifyAi } from '@/lib/opportunities/classifyAi'
import { truncateWords } from '@/lib/text/truncate'

export interface WeRemotoJobPosting {
  title: string
  description: string
  datePosted: string
  validThrough?: string
  employmentType?: string
  hiringOrganization?: { name?: string; logo?: string }
  jobLocationType?: string
  applicantLocationRequirements?: { name?: string } | { name?: string }[]
  baseSalary?: { currency?: string; value?: { minValue?: number; maxValue?: number; value?: number } }
}

// Every listing on this site is "remote", but a handful can still be marked
// on-site/hybrid for a specific city — this is the one guard against those
// slipping in, mirroring the "remote only" rule the GetOnBoard source uses.
export function isRemoteWeRemotoJob(posting: WeRemotoJobPosting): boolean {
  return posting.jobLocationType === 'TELECOMMUTE'
}

// One <script type="application/ld+json"> JobPosting block per detail page.
export function extractJobPostingJsonLd(html: string): WeRemotoJobPosting | null {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed?.['@type'] !== 'JobPosting') return null
    return parsed as WeRemotoJobPosting
  } catch {
    return null
  }
}

// Listing pages link to detail pages as /job-posts/id-<slug> — that slug is
// also this source's external id (WeRemoto never exposes a separate one).
export function extractJobSlugs(listingHtml: string): string[] {
  const matches = listingHtml.matchAll(/href="\/job-posts\/(id-[a-z0-9-]+)"/g)
  return [...new Set([...matches].map((match) => match[1]))]
}

export function mapEmploymentType(employmentType: string | undefined): OpportunityType {
  const value = (employmentType ?? '').toLowerCase()
  if (/freelance/.test(value)) return 'freelance'
  if (/intern|pr[aá]ctica/.test(value)) return 'practicas'
  if (/contract|project|proyecto|temporal/.test(value)) return 'proyecto'
  return 'empleo'
}

// No clean category field is exposed on the JobPosting schema here — closest
// available signal is the title/description text, same limitation the
// GetOnBoard mapper works around with its own category-name heuristic.
// Checked as an ordered list (not independent if/else-if on one blob of
// text) so a category only wins by matching the TITLE — the description is
// free-form marketing copy that mentions "software", "programa", etc. far
// too often to be a reliable signal (e.g. "Legal Assistant" postings that
// happen to mention office software were previously mis-classified as
// ingenieria because that description text was checked before the "legal"
// pattern ever got a turn). Falls back to the description only when the
// title itself doesn't match anything.
const AREA_PATTERNS: { area: ProfessionValue; pattern: RegExp }[] = [
  { area: 'ingenieria', pattern: /programador|desarroll(ador|o) de software|software engineer|ingenier[íi]a de software|\bfrontend\b|front-end|\bbackend\b|back-end|full.?stack|\bdevops\b/ },
  { area: 'marketing', pattern: /marketing|\bseo\b|social media|growth/ },
  { area: 'ventas', pattern: /ventas|\bsales\b|comercial/ },
  { area: 'diseno', pattern: /dise[ñn]|\bdesign(er)?\b|ilustrador/ },
  { area: 'finanzas', pattern: /finan|contab|cobranza|cr[eé]dito/ },
  { area: 'legal', pattern: /\blegal\b|abogad/ },
  { area: 'rrhh', pattern: /recursos humanos|\brrhh\b|\bhr\b|reclutamiento|recruit/ },
  { area: 'educacion', pattern: /profesor|idioma|educaci[oó]n|docente|\btutor\b|teacher/ },
  { area: 'datos', pattern: /analista de datos|data (scientist|analyst)|\bdatos\b/ },
  { area: 'producto', pattern: /product manager|\bproducto\b/ },
  {
    area: 'operaciones',
    pattern: /administrat|asistente|\bassistant\b|atenci[oó]n al cliente|customer service|operaciones|data entry|soporte|\bsupport\b/,
  },
]

function matchArea(text: string): ProfessionValue | null {
  const lower = text.toLowerCase()
  return AREA_PATTERNS.find(({ pattern }) => pattern.test(lower))?.area ?? null
}

export function mapArea(title: string, description: string): ProfessionValue {
  return matchArea(title) ?? matchArea(description) ?? 'otros'
}

export function mapLevel(title: string, description: string): ExperienceLevel | null {
  const text = `${title} ${description}`.toLowerCase()
  if (/\bsenior\b|\bsr\.?\b|lead\b/.test(text)) return 'senior'
  if (/semi.?senior|\bssr\.?\b|intermedio/.test(text)) return 'mid'
  if (/\bjunior\b|\bjr\.?\b|trainee|practicante/.test(text)) return 'junior'
  return null
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
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
  'costa rica': 'cr',
  panama: 'pa',
  panamá: 'pa',
  guatemala: 'gt',
  'republica dominicana': 'do',
  'república dominicana': 'do',
  'el salvador': 'sv',
  honduras: 'hn',
  nicaragua: 'ni',
  españa: 'es',
  espana: 'es',
  'estados unidos': 'us',
}

function locationRequirementName(posting: WeRemotoJobPosting): string | null {
  const req = posting.applicantLocationRequirements
  if (!req) return null
  const first = Array.isArray(req) ? req[0] : req
  return first?.name?.trim() || null
}

// applicantLocationRequirements.name is free text — sometimes a real country
// ("Argentina"), sometimes a region label ("Remoto LATAM") that isn't one.
export function inferCountry(posting: WeRemotoJobPosting): string | null {
  const name = locationRequirementName(posting)
  if (!name) return null
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  for (const [country, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    const normalizedCountry = country.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (normalized.includes(normalizedCountry)) return code
  }
  return null
}

export function buildLocation(posting: WeRemotoJobPosting): string {
  const name = locationRequirementName(posting)
  return name ? `Remoto · ${name}` : 'Remoto'
}

export function formatSalary(posting: WeRemotoJobPosting): string | null {
  const salary = posting.baseSalary?.value
  if (!salary) return null
  const currency = posting.baseSalary?.currency ?? ''
  if (salary.minValue && salary.maxValue) return `${currency} ${salary.minValue} – ${salary.maxValue}`.trim()
  if (salary.value) return `${currency} ${salary.value}`.trim()
  return null
}

export function mapWeRemotoJob(slug: string, posting: WeRemotoJobPosting, sourceUrl: string): OpportunityInsert {
  const title = posting.title.trim()
  const description = posting.description.trim()
  const publishedAt = new Date(posting.datePosted)
  // WeRemoto tells us the real expiry (validThrough) instead of us guessing
  // a fixed age cutoff the way GETONBOARD_MAX_AGE_DAYS does for that source.
  const expiresAt = posting.validThrough ? new Date(posting.validThrough) : null

  return {
    slug,
    title,
    company: posting.hiringOrganization?.name?.trim() || 'Empresa confidencial',
    company_logo_url: posting.hiringOrganization?.logo || null,
    type: mapEmploymentType(posting.employmentType),
    modality: 'remoto',
    is_ai: classifyAi({ title, tags: [], description }),
    area: mapArea(title, description),
    experience_level: mapLevel(title, description),
    location: buildLocation(posting),
    country: inferCountry(posting),
    language: 'es',
    salary_text: formatSalary(posting),
    summary: truncateWords(description, 200),
    description,
    tags: [],
    source: 'weremoto',
    source_url: sourceUrl,
    external_id: slug,
    published_at: publishedAt.toISOString(),
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    status: 'published',
  }
}
