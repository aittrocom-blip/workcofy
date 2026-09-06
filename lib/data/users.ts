import 'server-only'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export interface AdminUserRecord {
  id: string
  name: string | null
  email: string | null
  avatarId: string | null
  country: string | null
  city: string | null
  isAdmin: boolean
  createdAt: string
}

// Service-role read of every profile — admin-only, relies on middleware.ts
// gating /admin/* rather than RLS (RLS on profiles only lets a user read
// their own row).
export async function listUsers(): Promise<AdminUserRecord[]> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_id, country, city, is_admin, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list users: ${error.message}`)

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatarId: row.avatar_id,
    country: row.country,
    city: row.city,
    isAdmin: row.is_admin ?? false,
    createdAt: row.created_at,
  }))
}
