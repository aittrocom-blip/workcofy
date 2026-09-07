import { createServiceRoleClient } from './lib/serviceRoleClient'
import { runWeRemotoIngestion } from '@/lib/opportunities/sources/runWeRemotoIngestion'

async function main() {
  const supabase = createServiceRoleClient()
  const result = await runWeRemotoIngestion(supabase)
  console.log(
    `Read ${result.read} · kept ${result.kept} · discarded (not remote/unparseable) ${result.discarded} · stale ${result.stale} · AI ${result.ai}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
