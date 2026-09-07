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
  if (descriptor.searchTerm) {
    // Same PostgREST-injection guard listSpaces() uses.
    const sanitized = descriptor.searchTerm.replace(/[,()."*\\]/g, ' ')
    const term = `%${sanitized}%`
    query = query.or(`title.ilike.${term},provider.ilike.${term},summary.ilike.${term}`)
  }
  // "Relevant" = editor's picks first, then what people actually click;
  // "recent" = newest additions to the catalog.
  const ordered =
    descriptor.sort === 'recent'
      ? query.order('created_at', { ascending: false }).order('title', { ascending: true })
      : query
          .order('featured', { ascending: false })
          .order('click_count', { ascending: false })
          .order('title', { ascending: true })
  const { data, error } = await ordered
  if (error) throw new Error(`Failed to list courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

export async function listFeaturedCourses(limit = 3): Promise<CourseRecord[]> {
  const { data, error } = await publishedQuery().eq('featured', true).order('title', { ascending: true }).limit(limit)
  if (error) throw new Error(`Failed to list featured courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

// Lightweight count-only read for the Home's "Explorar cursos (N)" CTA — a
// head request, no rows fetched.
export async function countPublishedCourses(): Promise<number> {
  const supabase = createServerSupabaseClient()
  const { count, error } = await supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published')
  if (error) throw new Error(`Failed to count courses: ${error.message}`)
  return count ?? 0
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

export interface CourseClickStats {
  totalPublished: number
  totalClicks: number
  top: Pick<CourseRecord, 'id' | 'slug' | 'title' | 'provider' | 'click_count'>[]
}

// Admin-only read for /admin/estadisticas.
export async function getCourseClickStats(limit = 20): Promise<CourseClickStats> {
  const supabase = createAdminSupabaseClient()
  const { data, error, count } = await supabase
    .from('courses')
    .select('id, slug, title, provider, click_count', { count: 'exact' })
    .eq('status', 'published')
    .order('click_count', { ascending: false })
    .order('title', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`Failed to load course click stats: ${error.message}`)

  const { data: sumRows, error: sumError } = await supabase.from('courses').select('click_count').eq('status', 'published')
  if (sumError) throw new Error(`Failed to sum course clicks: ${sumError.message}`)

  return {
    totalPublished: count ?? 0,
    totalClicks: (sumRows ?? []).reduce((sum, row) => sum + (row.click_count as number), 0),
    top: data ?? [],
  }
}
