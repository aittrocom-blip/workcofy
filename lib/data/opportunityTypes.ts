import type {
  ContentStatus,
  ExperienceLevel,
  OpportunityLanguage,
  OpportunityModality,
  OpportunitySource,
  OpportunityType,
} from '@/lib/opportunities/constants'
import type { ProfessionValue } from '@/lib/professions'

export interface OpportunityRecord {
  id: string
  slug: string
  title: string
  company: string
  company_logo_url: string | null
  type: OpportunityType
  modality: OpportunityModality
  is_ai: boolean
  area: ProfessionValue | null
  experience_level: ExperienceLevel | null
  location: string | null
  country: string | null
  language: OpportunityLanguage | null
  salary_text: string | null
  summary: string | null
  description: string | null
  tags: string[]
  source: OpportunitySource
  source_url: string
  external_id: string | null
  published_at: string
  expires_at: string | null
  status: ContentStatus
  click_count: number
  created_at: string
  updated_at: string
}

export type OpportunityInsert = Omit<OpportunityRecord, 'id' | 'created_at' | 'updated_at' | 'click_count'>
