import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { CourseRecord } from '@/lib/data/courseTypes'
import { buildCourseQueryDescriptor, type CourseFilters } from '@/lib/courses/queryBuilder'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function publishedQuery() {
  return createServerSupabaseClient().from('courses').select('*').eq('status', 'published')
}

// The catalog is small (dozens of rows), so no pagination — one ordered list.
export async function listPublishedCourses(filters: CourseFilters = {}): Promise<CourseRecord[]> {
  const descriptor = buildCourseQueryDescriptor(filters)
  let query = publishedQuery()
  for (const filter of descriptor.eqFilters) query = query.eq(filter.column, filter.value)
  if (descriptor.certificate) query = query.eq('has_certificate', true)
  const { data, error } = await query.order('featured', { ascending: false }).order('title', { ascending: true })
  if (error) throw new Error(`Failed to list courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

export async function listFeaturedCourses(limit = 3): Promise<CourseRecord[]> {
  const { data, error } = await publishedQuery().eq('featured', true).order('title', { ascending: true }).limit(limit)
  if (error) throw new Error(`Failed to list featured courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

export async function getCourseById(id: string): Promise<CourseRecord | null> {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await publishedQuery().eq('id', id).maybeSingle()
  if (error) throw new Error(`Failed to load course ${id}: ${error.message}`)
  return (data as CourseRecord | null) ?? null
}

export async function incrementCourseClicks(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('courses').update({ click_count: currentCount + 1 }).eq('id', id)
  if (error) console.warn(`Failed to increment click_count for course ${id}: ${error.message}`)
}
