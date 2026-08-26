import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { buildMockSpaceFixtures } from '@/lib/places/mock-fixtures'

async function main() {
  const supabase = createAdminSupabaseClient()
  const fixtures = buildMockSpaceFixtures()

  const { error } = await supabase.from('spaces').upsert(fixtures, { onConflict: 'slug' })
  if (error) {
    console.error('Failed to seed mock spaces:', error.message)
    process.exit(1)
  }
  console.log(`Seeded ${fixtures.length} mock spaces (dev/demo data only — not real Google data).`)
}

main()
