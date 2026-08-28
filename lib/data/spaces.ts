import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { buildSpaceQueryDescriptor, type SpaceFilters } from '@/lib/data/spaceQueryBuilder'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { parseAmenities } from '@/lib/amenities/types'

export type { SpaceFilters }

function normalizeSpace(row: Record<string, unknown>): SpaceRecord {
  return { ...row, amenities: parseAmenities(row.amenities) } as SpaceRecord
}

export async function listSpaces(filters: SpaceFilters = {}): Promise<SpaceRecord[]> {
  const supabase = createServerSupabaseClient()
  const descriptor = buildSpaceQueryDescriptor(filters)

  let query = supabase.from('spaces').select('*').eq('active', true)
  for (const filter of descriptor.eqFilters) {
    query = query.eq(filter.column, filter.value)
  }
  if (descriptor.searchTerm) {
    // Sanitize search term to prevent PostgREST filter injection by removing reserved characters
    const sanitizedSearch = descriptor.searchTerm.replace(/[,()."*\\]/g, ' ')
    const term = `%${sanitizedSearch}%`
    query = query.or(`name.ilike.${term},address.ilike.${term}`)
  }

  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpacesByIds(ids: string[]): Promise<SpaceRecord[]> {
  if (ids.length === 0) return []
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').in('id', ids).eq('active', true)
  if (error) throw new Error(`Failed to load spaces by id: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpaceBySlug(slug: string): Promise<SpaceRecord | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to load space "${slug}": ${error.message}`)
  return data ? normalizeSpace(data) : null
}

// The anon key can only read `spaces` (RLS grants no write policy), so
// incrementing the page-view counter goes through the admin client instead —
// the space detail page calls this itself; never exposed to the browser.
export async function incrementViewCount(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('spaces')
    .update({ view_count: currentCount + 1 })
    .eq('id', id)
  if (error) {
    console.warn(`Failed to increment view_count for space ${id}: ${error.message}`)
  }
}
