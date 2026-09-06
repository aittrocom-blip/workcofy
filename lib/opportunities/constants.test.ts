import { describe, expect, it } from 'vitest'
import { extractCheckValues, readMigration } from '@/lib/testing/sqlCheckValues'
import { PROFESSION_VALUES } from '@/lib/professions'
import {
  CONTENT_STATUSES,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORY_SLUGS,
  OPPORTUNITY_LANGUAGES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_SOURCES,
  OPPORTUNITY_TYPES,
  opportunityCategoryFromSlug,
} from './constants'

const sql = readMigration('0014_opportunities_courses.sql')
const values = (options: readonly { value: string }[]) => options.map((o) => o.value)

describe('opportunity constants match the migration', () => {
  it('type', () => expect(extractCheckValues(sql, 'opportunities', 'type')).toEqual(values(OPPORTUNITY_TYPES)))
  it('modality', () => expect(extractCheckValues(sql, 'opportunities', 'modality')).toEqual(values(OPPORTUNITY_MODALITIES)))
  it('experience_level', () =>
    expect(extractCheckValues(sql, 'opportunities', 'experience_level')).toEqual(values(EXPERIENCE_LEVELS)))
  it('area', () => expect(extractCheckValues(sql, 'opportunities', 'area')).toEqual(PROFESSION_VALUES))
  it('language', () => expect(extractCheckValues(sql, 'opportunities', 'language')).toEqual(values(OPPORTUNITY_LANGUAGES)))
  it('source', () => expect(extractCheckValues(sql, 'opportunities', 'source')).toEqual(values(OPPORTUNITY_SOURCES)))
  it('status', () => expect(extractCheckValues(sql, 'opportunities', 'status')).toEqual([...CONTENT_STATUSES]))
})

describe('opportunityCategoryFromSlug', () => {
  it('resolves the five master-spec categories', () => {
    expect(OPPORTUNITY_CATEGORY_SLUGS.map((c) => c.slug)).toEqual(['remoto', 'freelance', 'proyectos', 'practicas', 'ia'])
    expect(opportunityCategoryFromSlug('ia')?.filter).toEqual({ ai: true })
    expect(opportunityCategoryFromSlug('proyectos')?.filter).toEqual({ type: 'proyecto' })
  })
  it('returns null for anything else', () => {
    expect(opportunityCategoryFromSlug('senior-react-developer-acme')).toBeNull()
  })
})
