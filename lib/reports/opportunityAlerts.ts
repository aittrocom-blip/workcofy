import type { SupabaseClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/email/sendMail'
import { listPublishedOpportunities } from '@/lib/data/opportunities'
import type { OpportunityFilters } from '@/lib/opportunities/queryBuilder'

export interface OpportunityAlertsResult {
  checked: number
  notified: number
}

interface SavedAlertRow {
  id: string
  user_id: string
  label: string
  filters: OpportunityFilters
  last_notified_at: string | null
  created_at: string
}

interface RecipientProfile {
  id: string
  email: string
}

function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'
  return `${base}${path}`
}

// listPublishedOpportunities() itself always uses its own anon client (the
// table is public-readable, matching what the alert owner already sees on
// /oportunidades) — the admin `supabase` passed in here is only needed for
// saved_opportunity_alerts and profiles, which RLS otherwise scopes to
// auth.uid() and a cron has no session for.
export async function runOpportunityAlerts(supabase: SupabaseClient): Promise<OpportunityAlertsResult> {
  const { data: alerts, error } = await supabase.from('saved_opportunity_alerts').select('*')
  if (error) throw new Error(`Failed to load saved alerts: ${error.message}`)

  const rows = (alerts ?? []) as SavedAlertRow[]
  if (rows.length === 0) return { checked: 0, notified: 0 }

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)))
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, email').in('id', userIds)
  if (profilesError) throw new Error(`Failed to load alert recipients: ${profilesError.message}`)
  const emailById = new Map(((profiles ?? []) as RecipientProfile[]).map((p) => [p.id, p.email]))

  let notified = 0
  for (const row of rows) {
    const email = emailById.get(row.user_id)
    if (!email) continue

    const since = new Date(row.last_notified_at ?? row.created_at)
    const page = await listPublishedOpportunities(row.filters ?? {})
    const matches = page.items.filter((item) => new Date(item.published_at) > since)
    if (matches.length === 0) continue

    const lines = matches.slice(0, 10).map((o) => `- ${o.title} (${o.company}): ${siteUrl(`/oportunidades/${o.slug}`)}`)
    const plural = matches.length === 1 ? '' : 'es'

    await sendMail({
      to: email,
      subject: `Workcofy: ${matches.length} oportunidad${plural} nueva${plural} para "${row.label}"`,
      text: `Hay novedades para tu alerta "${row.label}":\n\n${lines.join('\n')}\n\nVer todas: ${siteUrl('/oportunidades')}\n\n---\nGuardaste esta alerta en Workcofy. Puedes borrarla desde tu perfil (${siteUrl('/perfil')}).`,
    })

    await supabase.from('saved_opportunity_alerts').update({ last_notified_at: new Date().toISOString() }).eq('id', row.id)
    notified += 1
  }

  return { checked: rows.length, notified }
}
