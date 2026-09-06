import { createServiceRoleClient } from './lib/serviceRoleClient'
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import { GETONBOARD_CATEGORY_IDS, isFresh, mapGetOnBoardJob, shouldKeep } from '@/lib/opportunities/sources/getonboard'
import { fetchGetOnBoardCategoryPage } from '@/lib/opportunities/sources/getonboardClient'

const MAX_PAGES_PER_CATEGORY = 5
const UPSERT_CHUNK = 100

async function main() {
  const supabase = createServiceRoleClient()
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
    console.log(`${category}: ${rowsBySlug.size} accumulated`)
  }

  const rows = [...rowsBySlug.values()].map((row) => ({ ...row, updated_at: now.toISOString() }))
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK) {
    const { error } = await supabase
      .from('opportunities')
      .upsert(rows.slice(index, index + UPSERT_CHUNK), { onConflict: 'source,external_id' })
    if (error) {
      console.error(`Upsert failed at chunk ${index / UPSERT_CHUNK}: ${error.message}`)
      process.exit(1)
    }
  }

  const ai = rows.filter((row) => row.is_ai).length
  console.log(`Read ${read} · kept ${rows.length} · discarded (outside LatAm) ${discarded} · stale ${stale} · AI ${ai}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
