import type { SupabaseClient } from '@supabase/supabase-js'
import type { TipCategory } from '@/lib/data/tips'

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions'
// Confirmed available and fast on this account's NIM key — several other
// candidates (90b-vision, mistral-7b, gemma-3-12b, most meta/mistral
// "instruct" checkpoints) either 404 ("not found for account", i.e. not
// granted) or are past their end-of-life date on NVIDIA's catalog.
const NIM_MODEL = 'meta/llama-3.2-11b-vision-instruct'
const CATEGORIES: TipCategory[] = ['productividad', 'foco', 'ergonomia', 'ia', 'comunicacion', 'bienestar']
const MAX_TITLE_LENGTH = 80
const MAX_BODY_LENGTH = 320

interface GeneratedTip {
  title: string
  body: string
  category: TipCategory
}

function buildPrompt(existingTitles: string[], count: number): string {
  const avoidList = existingTitles.length > 0 ? existingTitles.map((t) => `- ${t}`).join('\n') : '(ninguno todavía)'
  return `Eres el editor de contenido de Workcofy, una app peruana de coworking, trabajo remoto y aprendizaje con IA.
Genera exactamente ${count} tips NUEVOS y distintos entre sí para trabajadores remotos.

Reglas para cada tip:
- title: título corto y concreto, sin punto final, máximo 60 caracteres.
- body: 1-2 frases, consejo accionable y específico (no genérico), máximo 200 caracteres.
- category: exactamente uno de estos valores (en minúsculas, sin acentos donde aplique): ${CATEGORIES.join(', ')}.
- Tono: directo, cercano, en español neutro/peruano informal (como le hablarías a un colega).
- No repitas ni parafrasees ninguno de estos títulos ya existentes:
${avoidList}

Responde ÚNICAMENTE con un array JSON válido, sin texto antes ni después, sin bloque de código markdown, con esta forma exacta:
[{"title": "...", "body": "...", "category": "..."}]`
}

// Tolerant of the model wrapping the array in prose or a ```json fence —
// extracts the first [...] block rather than assuming the whole response
// is clean JSON.
function parseGeneratedTips(raw: string): GeneratedTip[] {
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed.filter((item): item is GeneratedTip => {
    if (!item || typeof item !== 'object') return false
    const { title, body, category } = item as Record<string, unknown>
    return (
      typeof title === 'string' &&
      title.trim().length > 0 &&
      title.length <= MAX_TITLE_LENGTH &&
      typeof body === 'string' &&
      body.trim().length > 0 &&
      body.length <= MAX_BODY_LENGTH &&
      typeof category === 'string' &&
      CATEGORIES.includes(category as TipCategory)
    )
  })
}

export interface GenerateTipsResult {
  configured: boolean
  generated: number
  inserted: number
  duplicates: number
}

// Grows the tips pool a little every day via NVIDIA's free-tier, OpenAI-
// compatible NIM chat completions API (build.nvidia.com) so Explorar's
// rotating "Tips de hoy" strip (lib/data/tips.ts) has fresh material over
// time instead of looping the same hand-written seed tips forever. A silent
// no-op if NVIDIA_API_KEY isn't configured, and never throws past the
// caller — this is a nice-to-have on the daily cron, not something that
// should ever block ingestion or the signup digest.
export async function generateDailyTips(supabase: SupabaseClient, count = 3): Promise<GenerateTipsResult> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) return { configured: false, generated: 0, inserted: 0, duplicates: 0 }

  const { data: existing, error } = await supabase
    .from('tips')
    .select('title, sort_order')
    .order('sort_order', { ascending: false })
    .limit(80)
  if (error) throw new Error(`Failed to load existing tips: ${error.message}`)

  const existingRows = existing ?? []
  const existingTitles = existingRows.map((row) => row.title as string)
  const maxSortOrder = existingRows.reduce((max, row) => Math.max(max, (row.sort_order as number) ?? 0), 0)

  const response = await fetch(NIM_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages: [{ role: 'user', content: buildPrompt(existingTitles, count) }],
      temperature: 0.9,
      max_tokens: 700,
    }),
  })
  if (!response.ok) {
    throw new Error(`NVIDIA NIM request failed: HTTP ${response.status} ${await response.text().catch(() => '')}`)
  }

  const body = await response.json()
  const raw: string = body?.choices?.[0]?.message?.content ?? ''
  const generated = parseGeneratedTips(raw)

  const existingTitleSet = new Set(existingTitles.map((title) => title.toLowerCase().trim()))
  const unique = generated.filter((tip) => !existingTitleSet.has(tip.title.toLowerCase().trim()))
  const duplicates = generated.length - unique.length

  if (unique.length === 0) return { configured: true, generated: generated.length, inserted: 0, duplicates }

  const rows = unique.map((tip, index) => ({
    title: tip.title.trim(),
    body: tip.body.trim(),
    category: tip.category,
    sort_order: maxSortOrder + index + 1,
    published: true,
  }))

  const { error: insertError } = await supabase.from('tips').insert(rows)
  if (insertError) {
    // A title-uniqueness collision here just means another run inserted the
    // same title first (e.g. a manual re-run overlapping the cron) — not
    // worth failing the whole cron over.
    if (insertError.code === '23505') return { configured: true, generated: generated.length, inserted: 0, duplicates: rows.length }
    throw new Error(`Failed to insert generated tips: ${insertError.message}`)
  }

  return { configured: true, generated: generated.length, inserted: rows.length, duplicates }
}
