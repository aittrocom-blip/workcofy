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

export interface SpaceBenefitWithSpace extends SpaceBenefit {
  space: { name: string; slug: string; district: string; verified: boolean }
}

interface BenefitJoinRow extends SpaceBenefit {
  spaces: { name: string; slug: string; district: string; verified: boolean } | { name: string; slug: string; district: string; verified: boolean }[] | null
}

// Every benefit across the network, for the app's Beneficios screen —
// inner-joined to active spaces so a deactivated venue's perks drop out.
export async function listAllSpaceBenefits(): Promise<SpaceBenefitWithSpace[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('space_benefits')
    .select('id, space_id, label, icon, sort_order, spaces!inner(name, slug, district, verified)')
    .eq('spaces.active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list all benefits: ${error.message}`)
  return ((data ?? []) as unknown as BenefitJoinRow[]).flatMap((row) => {
    const space = Array.isArray(row.spaces) ? row.spaces[0] : row.spaces
    if (!space) return []
    const { spaces: _spaces, ...benefit } = row
    return [{ ...benefit, space }]
  })
}

export async function anySpaceHasBenefits(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { count, error } = await supabase
    .from('space_benefits')
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to check for benefits: ${error.message}`)
  return (count ?? 0) > 0
}
