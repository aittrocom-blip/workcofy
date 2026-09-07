import type { SupabaseClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/email/sendMail'

const DIGEST_RECIPIENT = 'aittro.com@gmail.com'
const WINDOW_HOURS = 24

export interface SignupDigestResult {
  count: number
  sent: boolean
}

interface NewProfile {
  name: string | null
  email: string
  created_at: string
}

function formatLima(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Silent by design — the user explicitly asked to only be emailed when
// there's actually something to report, not a daily "0 new users" noise
// email. Runs off the profiles table (not auth.users) since that's what
// already carries name/email together without a second admin API call.
export async function sendDailySignupDigest(supabase: SupabaseClient): Promise<SignupDigestResult> {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .select('name, email, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load new signups: ${error.message}`)

  const users = (data ?? []) as NewProfile[]
  if (users.length === 0) return { count: 0, sent: false }

  const lines = users.map((u) => `- ${u.name?.trim() || 'Sin nombre'} — ${u.email} — ${formatLima(u.created_at)}`)
  const plural = users.length === 1 ? '' : 's'

  await sendMail({
    to: DIGEST_RECIPIENT,
    subject: `Workcofy: ${users.length} registro${plural} nuevo${plural} en las últimas 24h`,
    text: `Se registraron ${users.length} usuario${plural} en Workcofy en las últimas 24 horas:\n\n${lines.join('\n')}`,
  })

  return { count: users.length, sent: true }
}
