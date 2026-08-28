import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface Review {
  id: string
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  reviewerName: string
}

export interface ReviewStats {
  average: number | null
  count: number
}

interface ReviewRow {
  id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  profiles: { name: string | null } | { name: string | null }[] | null
}

function reviewerNameFrom(profiles: ReviewRow['profiles']): string {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles
  return profile?.name?.trim() || 'Usuario Workcofy'
}

export async function listReviewsForSpace(spaceId: string): Promise<Review[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, rating, comment, created_at, updated_at, profiles(name)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })

  // Reviews are an enhancement to the space page, not core to it — a
  // read failure here (e.g. the migration hasn't been run yet) shouldn't
  // 500 the whole page the way incrementViewCount's own failure doesn't.
  if (error) {
    console.warn(`Failed to list reviews for space "${spaceId}": ${error.message}`)
    return []
  }

  return ((data ?? []) as ReviewRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewerName: reviewerNameFrom(row.profiles),
  }))
}

export function reviewStatsFrom(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) return { average: null, count: 0 }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return { average: total / reviews.length, count: reviews.length }
}
