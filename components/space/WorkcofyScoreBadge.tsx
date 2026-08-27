import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface WorkcofyScoreBadgeProps {
  space: SpaceRecord
}

export function WorkcofyScoreBadge({ space }: WorkcofyScoreBadgeProps) {
  const score = computeWorkcofyScore(space)

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h2 className="text-sm font-semibold tracking-tight">Workcofy Score</h2>
      {score != null ? (
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {score}
          <span className="text-lg font-semibold text-workcofy-yellow">/100</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Workcofy Score próximamente</p>
      )}
    </div>
  )
}
