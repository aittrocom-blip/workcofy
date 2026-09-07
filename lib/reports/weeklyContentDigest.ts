import type { SupabaseClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/email/sendMail'

const WINDOW_DAYS = 7

export interface WeeklyDigestResult {
  recipients: number
  newOpportunities: number
  newCourses: number
  sent: boolean
}

interface DigestRecipient {
  email: string
}

interface DigestOpportunity {
  title: string
  company: string
  slug: string
}

interface DigestCourse {
  title: string
  provider: string
}

function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'
  return `${base}${path}`
}

// Sent only to profiles with marketing_consent = true (the "Quiero recibir
// novedades y promociones" toggle already on /perfil) — reuses that opt-in
// instead of adding a second one. Silent if nothing genuinely new happened
// this week, same convention as sendDailySignupDigest.
export async function sendWeeklyContentDigest(supabase: SupabaseClient): Promise<WeeklyDigestResult> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: opportunities, error: oppError }, { data: courses, error: courseError }] = await Promise.all([
    supabase
      .from('opportunities')
      .select('title, company, slug')
      .eq('status', 'published')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(8),
    supabase
      .from('courses')
      .select('title, provider')
      .eq('status', 'published')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(8),
  ])
  if (oppError) throw new Error(`Failed to load weekly opportunities: ${oppError.message}`)
  if (courseError) throw new Error(`Failed to load weekly courses: ${courseError.message}`)

  const newOpportunities = (opportunities ?? []) as DigestOpportunity[]
  const newCourses = (courses ?? []) as DigestCourse[]
  if (newOpportunities.length === 0 && newCourses.length === 0) {
    return { recipients: 0, newOpportunities: 0, newCourses: 0, sent: false }
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from('profiles')
    .select('email')
    .eq('marketing_consent', true)
  if (recipientsError) throw new Error(`Failed to load digest recipients: ${recipientsError.message}`)

  const audience = (recipients ?? []) as DigestRecipient[]
  if (audience.length === 0) {
    return { recipients: 0, newOpportunities: newOpportunities.length, newCourses: newCourses.length, sent: false }
  }

  const opportunityLines = newOpportunities.map((o) => `- ${o.title} (${o.company}): ${siteUrl(`/oportunidades/${o.slug}`)}`)
  const courseLines = newCourses.map((c) => `- ${c.title} (${c.provider})`)

  const bodyParts = [
    'Esto es lo nuevo en Workcofy esta semana:',
    newOpportunities.length > 0 ? `\nTrabajos remotos nuevos:\n${opportunityLines.join('\n')}` : '',
    newCourses.length > 0 ? `\nCursos nuevos:\n${courseLines.join('\n')}` : '',
    `\nVer todo: ${siteUrl('/oportunidades')} · ${siteUrl('/aprende')}`,
    `\n---\nRecibes esto porque activaste "novedades y promociones" en tu perfil de Workcofy. Puedes desactivarlo cuando quieras desde ${siteUrl('/perfil')}.`,
  ].filter(Boolean)
  const text = bodyParts.join('\n')

  await Promise.all(
    audience.map((recipient) =>
      sendMail({
        to: recipient.email,
        subject: `Workcofy: lo nuevo de esta semana (${newOpportunities.length} trabajos, ${newCourses.length} cursos)`,
        text,
      })
    )
  )

  return { recipients: audience.length, newOpportunities: newOpportunities.length, newCourses: newCourses.length, sent: true }
}
