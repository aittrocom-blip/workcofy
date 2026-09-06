import type { ContentStatus } from '@/lib/opportunities/constants'
import type { CourseCategory, CourseLanguage, CourseLevel, CoursePrice, CourseTool } from '@/lib/courses/constants'
import type { ProfessionValue } from '@/lib/professions'

export interface CourseRecord {
  id: string
  slug: string
  title: string
  provider: string
  category: CourseCategory
  area: ProfessionValue | null
  tool: CourseTool | null
  level: CourseLevel
  duration_text: string | null
  price: CoursePrice
  price_text: string | null
  has_certificate: boolean
  language: CourseLanguage
  official: boolean
  url: string
  image_url: string | null
  summary: string | null
  description: string | null
  tags: string[]
  featured: boolean
  last_verified_at: string | null
  status: ContentStatus
  click_count: number
  created_at: string
  updated_at: string
}

export type CourseInsert = Omit<CourseRecord, 'id' | 'created_at' | 'updated_at' | 'click_count'>
