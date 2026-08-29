import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Mission {
  id: string
  key: string
  label: string
  description: string
  trackedAction: 'review' | 'favorite'
  targetCount: number
  coins: number
  period: 'once' | 'monthly'
  sortOrder: number
}

interface MissionRow {
  id: string
  key: string
  label: string
  description: string
  tracked_action: 'review' | 'favorite'
  target_count: number
  coins: number
  period: 'once' | 'monthly'
  sort_order: number
}

export async function listMissions(): Promise<Mission[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select('id, key, label, description, tracked_action, target_count, coins, period, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list missions: ${error.message}`)

  return ((data ?? []) as MissionRow[]).map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    trackedAction: row.tracked_action,
    targetCount: row.target_count,
    coins: row.coins,
    period: row.period,
    sortOrder: row.sort_order,
  }))
}

export interface MissionProgressEntry {
  missionKey: string
  completedAt: string
}

interface MissionProgressRow {
  completed_at: string
  missions: { key: string } | { key: string }[] | null
}

export async function listMissionProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<MissionProgressEntry[]> {
  const { data, error } = await supabase
    .from('mission_progress')
    .select('completed_at, missions(key)')
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to list mission progress: ${error.message}`)

  return ((data ?? []) as MissionProgressRow[])
    .map((row) => {
      const mission = Array.isArray(row.missions) ? row.missions[0] : row.missions
      return mission ? { missionKey: mission.key, completedAt: row.completed_at } : null
    })
    .filter((entry): entry is MissionProgressEntry => entry !== null)
}

// Mirrors reviewStatsFrom(reviews) in lib/data/reviews.ts — a pure function
// over already-fetched rows, kept in sync with the trigger's own month
// boundary (Date.UTC, matching the migration's date_trunc('month', now())
// in UTC) so the two never disagree about which "month" a completion is in.
export function cartaEspecialUnlockCountThisMonth(progress: MissionProgressEntry[]): number {
  const now = new Date()
  const startOfMonthUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  return progress.filter((entry) => new Date(entry.completedAt).getTime() >= startOfMonthUtc).length
}
