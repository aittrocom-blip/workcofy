'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import type { Review, ReviewStats } from '@/lib/data/reviews'

interface ReviewsSectionProps {
  spaceId: string
  initialReviews: Review[]
  initialStats: ReviewStats
}

export function ReviewsSection({ spaceId, initialReviews, initialStats }: ReviewsSectionProps) {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [reviews, setReviews] = useState(initialReviews)
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setAuthLoaded(true)
    })
  }, [])

  const myReview = userId ? reviews.find((review) => review.userId === userId) : undefined

  function applyLocalUpdate(next: Review) {
    setReviews((current) => {
      const withoutMine = current.filter((review) => review.userId !== next.userId)
      const updated = [next, ...withoutMine]
      const total = updated.reduce((sum, review) => sum + review.rating, 0)
      setStats({ average: total / updated.length, count: updated.length })
      return updated
    })
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight">Reseñas</h2>
        {stats.count > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-workcofy-yellow/15 px-2.5 py-1 text-xs font-semibold">
            <span className="text-workcofy-yellow">Workcofy {stats.average!.toFixed(1)}</span>
            <span className="text-gray-500">({stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'})</span>
          </span>
        )}
      </div>

      {authLoaded && (
        <div className="mt-4">
          {userId ? (
            <ReviewForm spaceId={spaceId} userId={userId} existing={myReview} onSaved={applyLocalUpdate} />
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="font-semibold text-black hover:underline"
              >
                Inicia sesión
              </Link>{' '}
              para dejar una reseña.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Sé el primero en dejar una reseña.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{review.reviewerName}</span>
                <Stars value={review.rating} size="sm" />
              </div>
              {review.comment && <p className="mt-1.5 text-sm text-gray-600">{review.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">{formatReviewDate(review.updatedAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface ReviewFormProps {
  spaceId: string
  userId: string
  existing: Review | undefined
  onSaved: (review: Review) => void
}

function ReviewForm({ spaceId, userId, existing, onSaved }: ReviewFormProps) {
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (rating === 0) {
      setError('Elige una calificación de 1 a 5 estrellas.')
      return
    }
    setSaving(true)
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data, error: upsertError } = await supabase
        .from('reviews')
        .upsert(
          { user_id: userId, space_id: spaceId, rating, comment: comment.trim() || null },
          { onConflict: 'user_id,space_id' }
        )
        .select('id, created_at, updated_at')
        .single()

      if (upsertError || !data) throw upsertError ?? new Error('No se pudo guardar la reseña')

      onSaved({
        id: data.id,
        userId,
        rating,
        comment: comment.trim() || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewerName: 'Tú',
      })
      window.dispatchEvent(new Event('workcofy:reward-earned'))
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4">
      <Stars value={rating} size="lg" onChange={setRating} />
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value.slice(0, 500))}
        placeholder="¿Cómo fue tu experiencia? (opcional)"
        rows={3}
        maxLength={500}
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-black"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : existing ? 'Actualizar reseña' : 'Publicar reseña'}
      </button>
    </form>
  )
}

function Stars({ value, size, onChange }: { value: number; size: 'sm' | 'lg'; onChange?: (value: number) => void }) {
  const starSize = size === 'lg' ? 'h-6 w-6' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          aria-label={`${star} estrellas`}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <svg
            viewBox="0 0 20 20"
            className={`${starSize} ${star <= value ? 'text-workcofy-yellow' : 'text-gray-200'}`}
            fill="currentColor"
          >
            <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}
