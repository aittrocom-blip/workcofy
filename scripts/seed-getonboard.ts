import { createServiceRoleClient } from './lib/serviceRoleClient'
import { runGetOnBoardIngestion } from '@/lib/opportunities/sources/runGetOnBoardIngestion'

async function main() {
  const supabase = createServiceRoleClient()
  const result = await runGetOnBoardIngestion(supabase)
  console.log(
    `Read ${result.read} · kept ${result.kept} · discarded (outside LatAm) ${result.discarded} · stale ${result.stale} · AI ${result.ai}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
