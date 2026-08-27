import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface SpaceBenefit {
  id: string
  space_id: string
  label: string
  icon: string | null
  sort_order: number
}

export async function listSpaceBenefits(spaceId: string): Promise<SpaceBenefit[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('space_benefits')
    .select('id, space_id, label, icon, sort_order')
    .eq('space_id', spaceId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list benefits for space ${spaceId}: ${error.message}`)
  return data ?? []
}

export async function anySpaceHasBenefits(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { count, error } = await supabase
    .from('space_benefits')
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to check for benefits: ${error.message}`)
  return (count ?? 0) > 0
}
