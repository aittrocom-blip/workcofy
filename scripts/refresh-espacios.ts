import { createServiceRoleClient } from './lib/serviceRoleClient'
import { refreshEspacios } from '@/lib/places/refreshEspacios'

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_MAPS_SERVER_API_KEY is not set — this script needs a Google Maps Platform key with Places API enabled.')
    process.exit(1)
  }

  const supabase = createServiceRoleClient()
  const result = await refreshEspacios(supabase, apiKey)
  console.log(`Refreshed ${result.refreshed}/${result.total} spaces (${result.failed} failed).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
