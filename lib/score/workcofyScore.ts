import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { averageKnownAmenities } from '@/lib/amenities/types'

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
  // wifi now defaults to true for every space (see DEFAULT_AMENITIES) — a
  // constant assumption, not a differentiating signal, so it's excluded here
  // to keep the score reflecting genuinely known/verified amenities.
  const { wifi: _wifi, ...rest } = space.amenities?.para_trabajar ?? {}
  return averageKnownAmenities(rest)
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
