import type { SpaceRecord } from '@/lib/data/spaceTypes'

const RATING_WEIGHT = 60
const AMENITIES_WEIGHT = 40
// review_count at which confidence effectively saturates to 1
const CONFIDENCE_REVIEW_BASELINE = 50

function ratingComponent(rating: number, reviewCount: number): number {
  const normalized = (rating / 5) * 100
  const confidence = Math.min(
    1,
    Math.log10(reviewCount + 1) / Math.log10(CONFIDENCE_REVIEW_BASELINE)
  )
  // Below full confidence, pull toward the neutral midpoint (50) rather than
  // discarding the rating — a single 5-star review shouldn't read as a flat 100.
  return normalized * confidence + 50 * (1 - confidence)
}

function amenitiesComponent(space: SpaceRecord): number | null {
  const known = Object.values(space.amenities.para_trabajar).filter(
    (value): value is boolean => value !== null
  )
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}

export function computeWorkcofyScore(space: SpaceRecord): number | null {
  if (space.workcofy_score != null) return space.workcofy_score

  const rating = space.rating != null ? ratingComponent(space.rating, space.review_count ?? 0) : null
  const amenities = amenitiesComponent(space)

  if (rating == null && amenities == null) return null
  if (rating == null) return Math.round(amenities as number)
  if (amenities == null) return Math.round(rating)

  return Math.round(rating * (RATING_WEIGHT / 100) + amenities * (AMENITIES_WEIGHT / 100))
}
