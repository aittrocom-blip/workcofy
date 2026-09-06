import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import {
  OPPORTUNITY_PAGE_SIZE,
  buildOpportunityQueryDescriptor,
  type OpportunityFilters,
} from '@/lib/opportunities/queryBuilder'

export interface OpportunityPage {
  items: OpportunityRecord[]
  total: number
  page: number
  pageSize: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Published and not expired. RLS already hides drafts/archived from the anon
// key; the status filter is repeated here so the intent is visible in code.
function publishedQuery() {
  const supabase = createServerSupabaseClient()
  return supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
}

export async function listPublishedOpportunities(filters: OpportunityFilters = {}): Promise<OpportunityPage> {
  const descriptor = buildOpportunityQueryDescriptor(filters)
  let query = publishedQuery()
  for (const filter of descriptor.eqFilters) query = query.eq(filter.column, filter.value)
  if (descriptor.isAi !== null) query = query.eq('is_ai', descriptor.isAi)
  if (descriptor.searchTerm) {
    // Same PostgREST-injection guard listSpaces() uses.
    const sanitized = descriptor.searchTerm.replace(/[,()."*\\]/g, ' ')
    const term = `%${sanitized}%`
    query = query.or(`title.ilike.${term},company.ilike.${term}`)
  }
  const ordered = descriptor.sort === 'relevant' ? query.order('click_count', { ascending: false }).order('published_at', { ascending: false }) : query.order('published_at', { ascending: false })
  const { data, error, count } = await ordered.range(descriptor.from, descriptor.to)
  if (error) throw new Error(`Failed to list opportunities: ${error.message}`)
  return {
    items: (data ?? []) as OpportunityRecord[],
    total: count ?? 0,
    page: descriptor.page,
    pageSize: OPPORTUNITY_PAGE_SIZE,
  }
}

export async function listRecentOpportunities(limit = 3): Promise<OpportunityRecord[]> {
  const { data, error } = await publishedQuery().order('published_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`Failed to list recent opportunities: ${error.message}`)
  return (data ?? []) as OpportunityRecord[]
}

export async function getOpportunityBySlug(slug: string): Promise<OpportunityRecord | null> {
  const { data, error } = await publishedQuery().eq('slug', slug).maybeSingle()
  if (error) throw new Error(`Failed to load opportunity "${slug}": ${error.message}`)
  return (data as OpportunityRecord | null) ?? null
}

export async function getOpportunityById(id: string): Promise<OpportunityRecord | null> {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await publishedQuery().eq('id', id).maybeSingle()
  if (error) throw new Error(`Failed to load opportunity ${id}: ${error.message}`)
  return (data as OpportunityRecord | null) ?? null
}

export async function listPublishedOpportunitySlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('slug, updated_at')
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  if (error) throw new Error(`Failed to list opportunity slugs: ${error.message}`)
  return data ?? []
}

// Outbound-click counter for the /ir/oportunidad/[id] redirect. Same
// service-role pattern as incrementViewCount() in lib/data/spaces.ts.
export async function incrementOpportunityClicks(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('opportunities').update({ click_count: currentCount + 1 }).eq('id', id)
  if (error) console.warn(`Failed to increment click_count for opportunity ${id}: ${error.message}`)
}
