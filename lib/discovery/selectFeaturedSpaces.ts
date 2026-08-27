import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

export function selectFeaturedSpaces(spaces: SpaceRecord[], limit = 6): SpaceRecord[] {
  return [...spaces]
    .sort((a, b) => {
      const scoreA = computeWorkcofyScore(a) ?? -1
      const scoreB = computeWorkcofyScore(b) ?? -1
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.review_count ?? 0) - (a.review_count ?? 0)
    })
    .slice(0, limit)
}
