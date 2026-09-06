// Scripts can't import lib/supabase/admin.ts: its `import 'server-only'`
// only resolves inside Next's bundler. Same client, built here without it.
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (run via the npm scripts, which load .env.local)'
    )
  }
  return createClient(url, serviceRoleKey)
}
