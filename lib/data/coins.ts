import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CoinRule {
  id: string
  action: string
  label: string
  coins: number
  sort_order: number
}

export interface CoinRedemption {
  id: string
  label: string
  coins_required: number
  icon: string | null
  sort_order: number
}

export async function listCoinRules(): Promise<CoinRule[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('coin_rules')
    .select('id, action, label, coins, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list coin rules: ${error.message}`)
  return data ?? []
}

export async function listCoinRedemptions(): Promise<CoinRedemption[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('coin_redemptions')
    .select('id, label, coins_required, icon, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list coin redemptions: ${error.message}`)
  return data ?? []
}
