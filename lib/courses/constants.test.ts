import { describe, expect, it } from 'vitest'
import { extractCheckValues, readMigration } from '@/lib/testing/sqlCheckValues'
import { PROFESSION_VALUES } from '@/lib/professions'
import { CONTENT_STATUSES } from '@/lib/opportunities/constants'
import {
  COURSE_CATEGORIES,
  COURSE_LANGUAGES,
  COURSE_LEVELS,
  COURSE_PRICES,
  COURSE_TOOLS,
  courseCategoryFromSlug,
  coursePriceDisplay,
} from './constants'

const sql = readMigration('0014_opportunities_courses.sql')
const values = (options: readonly { value: string }[]) => options.map((o) => o.value)

describe('course constants match the migration', () => {
  it('category', () => expect(extractCheckValues(sql, 'courses', 'category')).toEqual(values(COURSE_CATEGORIES)))
  it('area', () => expect(extractCheckValues(sql, 'courses', 'area')).toEqual(PROFESSION_VALUES))
  it('tool', () => expect(extractCheckValues(sql, 'courses', 'tool')).toEqual(values(COURSE_TOOLS)))
  it('level', () => expect(extractCheckValues(sql, 'courses', 'level')).toEqual(values(COURSE_LEVELS)))
  it('price', () => expect(extractCheckValues(sql, 'courses', 'price')).toEqual(values(COURSE_PRICES)))
  it('language', () => expect(extractCheckValues(sql, 'courses', 'language')).toEqual(values(COURSE_LANGUAGES)))
  it('status', () => expect(extractCheckValues(sql, 'courses', 'status')).toEqual([...CONTENT_STATUSES]))
})

describe('courseCategoryFromSlug', () => {
  it('maps the four URL slugs', () => {
    expect(courseCategoryFromSlug('ia-desde-cero')?.value).toBe('ia_desde_cero')
    expect(courseCategoryFromSlug('certificaciones')?.value).toBe('certificaciones')
    expect(courseCategoryFromSlug('nope')).toBeNull()
  })
})

describe('coursePriceDisplay', () => {
  it('always uses a plain Gratis/Pago label, keeping price_text as the detail', () => {
    expect(coursePriceDisplay('pago', 'USD 99 aprox. el examen (varía por país); preparación gratuita en Microsoft Learn')).toEqual({
      label: 'Pago',
      detail: 'USD 99 aprox. el examen (varía por país); preparación gratuita en Microsoft Learn',
    })
    expect(coursePriceDisplay('gratis', 'Auditar gratis; certificado de Coursera de pago')).toEqual({
      label: 'Gratis',
      detail: 'Auditar gratis; certificado de Coursera de pago',
    })
  })
  it('has no detail when price_text is missing', () => {
    expect(coursePriceDisplay('gratis', null)).toEqual({ label: 'Gratis', detail: null })
    expect(coursePriceDisplay('pago', null)).toEqual({ label: 'Pago', detail: null })
  })
})
