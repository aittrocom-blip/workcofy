import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildSpaceQueryDescriptor, type SpaceFilters } from '@/lib/data/spaceQueryBuilder'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

export type { SpaceFilters }

export async function listSpaces(filters: SpaceFilters = {}): Promise<SpaceRecord[]> {
  const supabase = createServerSupabaseClient()
  const descriptor = buildSpaceQueryDescriptor(filters)

  let query = supabase.from('spaces').select('*').eq('active', true)
  for (const filter of descriptor.eqFilters) {
    query = query.eq(filter.column, filter.value)
  }
  if (descriptor.searchTerm) {
    const term = `%${descriptor.searchTerm}%`
    query = query.or(`name.ilike.${term},address.ilike.${term}`)
  }

  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []) as SpaceRecord[]
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
  return data as SpaceRecord | null
}
