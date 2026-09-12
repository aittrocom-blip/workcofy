import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export type SpaceSuggestionStatus = 'pending' | 'approved' | 'rejected'

export interface SpaceSuggestionRecord {
  id: string
  user_id: string
  name: string
  category: string
  district: string
  country: string
  address: string | null
  notes: string | null
  status: SpaceSuggestionStatus
  created_space_id: string | null
  created_at: string
  reviewed_at: string | null
  /** Submitter's display name, joined from profiles — null if they never set one. */
  submitterName: string | null
}

// Admin-only (service role — space_suggestions' RLS only lets a user read
// their own rows, so listing everyone's needs to bypass it, same as every
// other admin read in this codebase).
export async function listSpaceSuggestions(status?: SpaceSuggestionStatus): Promise<SpaceSuggestionRecord[]> {
  const supabase = createAdminSupabaseClient()
  let query = supabase
    .from('space_suggestions')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(`Failed to list space suggestions: ${error.message}`)

  const rows = data ?? []
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
  const names = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds)
    if (profilesError) {
      // A missing optional profile should not make the entire admin queue
      // unusable; the row will display "un usuario" instead.
      console.warn(`Failed to load suggestion submitter profiles: ${profilesError.message}`)
    } else {
      for (const profile of profiles ?? []) {
        if (profile.name) names.set(profile.id, profile.name)
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    submitterName: names.get(row.user_id) ?? null,
  })) as SpaceSuggestionRecord[]
}
