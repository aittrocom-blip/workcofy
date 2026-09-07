import type { SupabaseClient } from '@supabase/supabase-js'
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import { extractJobPostingJsonLd, extractJobSlugs, isRemoteWeRemotoJob, mapWeRemotoJob } from './weremoto'
import { fetchWeRemotoJobPages, fetchWeRemotoListingPage, weRemotoJobUrl } from './weremotoClient'

const UPSERT_CHUNK = 100

export interface WeRemotoIngestionResult {
  read: number
  kept: number
  discarded: number
  stale: number
  ai: number
}

// Shared by the CLI script (scripts/seed-weremoto.ts) and the daily cron
// route — same logic either way, just a different Supabase client and a
// different way of reporting the result. Mirrors runGetOnBoardIngestion.ts.
export async function runWeRemotoIngestion(supabase: SupabaseClient): Promise<WeRemotoIngestionResult> {
  const now = new Date()
  const listingHtml = await fetchWeRemotoListingPage()
  const slugs = extractJobSlugs(listingHtml)
  const pages = await fetchWeRemotoJobPages(slugs)

  let stale = 0
  let discarded = 0
  const rows: OpportunityInsert[] = []

  for (const [slug, html] of pages) {
    const posting = extractJobPostingJsonLd(html)
    if (!posting) {
      discarded += 1
      continue
    }
    if (posting.validThrough && new Date(posting.validThrough).getTime() < now.getTime()) {
      stale += 1
      continue
    }
    if (!isRemoteWeRemotoJob(posting)) {
      discarded += 1
      continue
    }
    rows.push(mapWeRemotoJob(slug, posting, weRemotoJobUrl(slug)))
  }

  const withUpdatedAt = rows.map((row) => ({ ...row, updated_at: now.toISOString() }))
  for (let index = 0; index < withUpdatedAt.length; index += UPSERT_CHUNK) {
    const { error } = await supabase
      .from('opportunities')
      .upsert(withUpdatedAt.slice(index, index + UPSERT_CHUNK), { onConflict: 'source,external_id' })
    if (error) throw new Error(`Upsert failed at chunk ${index / UPSERT_CHUNK}: ${error.message}`)
  }

  return {
    read: slugs.length,
    kept: withUpdatedAt.length,
    discarded,
    stale,
    ai: withUpdatedAt.filter((row) => row.is_ai).length,
  }
}
