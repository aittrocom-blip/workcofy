import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import { OPPORTUNITY_COUNTRIES, type OpportunityType } from './constants'

const EMPLOYMENT_TYPE_BY_TYPE: Record<OpportunityType, string> = {
  empleo: 'FULL_TIME',
  freelance: 'CONTRACTOR',
  proyecto: 'CONTRACTOR',
  practicas: 'INTERN',
}

function countryName(code: string | null): string | null {
  if (!code) return null
  return OPPORTUNITY_COUNTRIES.find((c) => c.value === code)?.label ?? null
}

// Google for Jobs structured data (schema.org JobPosting) for the opportunity
// detail page — a job aggregator's cheapest source of organic traffic. Built
// only from fields already stored on the row; baseSalary is intentionally
// left out since we only keep a free-text salary_text, not a structured
// min/max the schema requires.
export function buildJobPostingJsonLd(opportunity: OpportunityRecord, siteUrl: string): Record<string, unknown> {
  const country = countryName(opportunity.country)
  const isRemote = opportunity.modality === 'remoto'

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: opportunity.title,
    description: opportunity.description || opportunity.summary || opportunity.title,
    identifier: { '@type': 'PropertyValue', name: 'Workcofy', value: opportunity.id },
    datePosted: opportunity.published_at,
    ...(opportunity.expires_at ? { validThrough: opportunity.expires_at } : {}),
    employmentType: EMPLOYMENT_TYPE_BY_TYPE[opportunity.type],
    hiringOrganization: {
      '@type': 'Organization',
      name: opportunity.company,
      ...(opportunity.company_logo_url ? { logo: opportunity.company_logo_url } : {}),
    },
    ...(isRemote
      ? {
          jobLocationType: 'TELECOMMUTE',
          ...(country ? { applicantLocationRequirements: { '@type': 'Country', name: country } } : {}),
        }
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              ...(opportunity.country ? { addressCountry: opportunity.country.toUpperCase() } : {}),
              ...(opportunity.location ? { addressLocality: opportunity.location } : {}),
            },
          },
        }),
    url: `${siteUrl}/oportunidades/${opportunity.slug}`,
  }
}
