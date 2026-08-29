import type { SupabaseClient } from '@supabase/supabase-js'

export interface RewardEvent {
  id: string
  label: string
  coins: number
  spaceName: string | null
  createdAt: string
}

interface RewardEventRow {
  id: string
  label: string
  coins: number
  created_at: string
  spaces: { name: string } | { name: string }[] | null
}

export async function listRewardEvents(supabase: SupabaseClient, userId: string): Promise<RewardEvent[]> {
  const { data, error } = await supabase
    .from('reward_events')
    .select('id, label, coins, created_at, spaces(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list reward events: ${error.message}`)

  return ((data ?? []) as RewardEventRow[]).map((row) => {
    const space = Array.isArray(row.spaces) ? row.spaces[0] : row.spaces
    return {
      id: row.id,
      label: row.label,
      coins: row.coins,
      spaceName: space?.name ?? null,
      createdAt: row.created_at,
    }
  })
}

// Mirrors reviewStatsFrom(reviews) in lib/data/reviews.ts — balance is never
// stored, only ever computed from the ledger at read time.
export function rewardsBalanceFrom(events: RewardEvent[]): number {
  return events.reduce((sum, event) => sum + event.coins, 0)
}
