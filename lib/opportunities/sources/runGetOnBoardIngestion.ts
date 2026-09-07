import type { SupabaseClient } from '@supabase/supabase-js'
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import { GETONBOARD_CATEGORY_IDS, isFresh, mapGetOnBoardJob, shouldKeep } from './getonboard'
import { fetchGetOnBoardCategoryPage } from './getonboardClient'

const MAX_PAGES_PER_CATEGORY = 5
const UPSERT_CHUNK = 100

export interface GetOnBoardIngestionResult {
  read: number
  kept: number
  discarded: number
  stale: number
  ai: number
}

// The actual ingestion run, shared by the CLI script (scripts/seed-getonboard.ts,
// for manual/on-demand runs) and the daily cron route
// (app/api/cron/seed-getonboard/route.ts) — same logic either way, just a
// different Supabase client and a different way of reporting the result.
export async function runGetOnBoardIngestion(supabase: SupabaseClient): Promise<GetOnBoardIngestionResult> {
  const now = new Date()
  const rowsBySlug = new Map<string, OpportunityInsert>()
  let read = 0
  let stale = 0
  let discarded = 0

  for (const category of GETONBOARD_CATEGORY_IDS) {
    let page = 1
    let totalPages = 1
    while (page <= totalPages && page <= MAX_PAGES_PER_CATEGORY) {
      const result = await fetchGetOnBoardCategoryPage(category, page)
      totalPages = result.totalPages
      read += result.jobs.length
      let sawFresh = false
      for (const job of result.jobs) {
        if (!isFresh(job, now)) {
          stale += 1
          continue
        }
        sawFresh = true
        if (!shouldKeep(job)) {
          discarded += 1
          continue
        }
        rowsBySlug.set(job.id, mapGetOnBoardJob(job, now))
      }
      // Pages come newest-first; once a whole page is older than the cutoff
      // nothing fresher is behind it.
      if (!sawFresh) break
      page += 1
    }
  }

  const rows = [...rowsBySlug.values()].map((row) => ({ ...row, updated_at: now.toISOString() }))
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK) {
    const { error } = await supabase
      .from('opportunities')
      .upsert(rows.slice(index, index + UPSERT_CHUNK), { onConflict: 'source,external_id' })
    if (error) throw new Error(`Upsert failed at chunk ${index / UPSERT_CHUNK}: ${error.message}`)
  }

  return {
    read,
    kept: rows.length,
    discarded,
    stale,
    ai: rows.filter((row) => row.is_ai).length,
  }
}
