import { createServerSupabaseClient } from '@/lib/supabase/server'

export type TipCategory = 'productividad' | 'foco' | 'ergonomia' | 'ia' | 'comunicacion' | 'bienestar'

export interface Tip {
  id: string
  title: string
  body: string
  category: TipCategory
  sort_order: number
}

export const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  productividad: 'Productividad',
  foco: 'Foco',
  ergonomia: 'Ergonomía',
  ia: 'Trabajar con IA',
  comunicacion: 'Comunicación',
  bienestar: 'Bienestar',
}

// Never throws: the tips block is optional decoration on Explorar, and an
// unapplied 0022 migration should hide it, not break the page.
export async function listPublishedTips(): Promise<Tip[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tips')
    .select('id, title, body, category, sort_order')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) return []
  return (data ?? []) as Tip[]
}

// Deterministic per Lima calendar day (same picks for everyone, no change
// between navigations that day) — rotates through the pool in `count`-sized
// blocks rather than picking randomly, so as the pool grows (see
// lib/tips/generateTips.ts) every tip eventually gets its turn instead of a
// few lucky ones dominating.
export function tipsOfTheDay(tips: Tip[], date: Date = new Date(), count = 6): Tip[] {
  if (tips.length === 0) return []
  const lima = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }))
  const start = new Date(lima.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((lima.getTime() - start.getTime()) / 86_400_000)
  const blockStart = (dayOfYear * count) % tips.length
  const picked: Tip[] = []
  for (let i = 0; i < Math.min(count, tips.length); i++) {
    picked.push(tips[(blockStart + i) % tips.length])
  }
  return picked
}
