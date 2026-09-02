import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { topAmenityHighlights } from '@/lib/amenities/highlights'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface WorkcofyScoreBadgeProps {
  space: SpaceRecord
}

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excelente para trabajar'
  if (score >= 70) return 'Muy bueno para trabajar'
  if (score >= 50) return 'Bueno para trabajar'
  return 'Aceptable para trabajar'
}

export function WorkcofyScoreBadge({ space }: WorkcofyScoreBadgeProps) {
  const score = computeWorkcofyScore(space)
  const progress = score != null ? (score / 100) * CIRCUMFERENCE : 0
  const highlights = topAmenityHighlights(space.amenities)

  return (
    <div className="mt-6 flex items-center gap-5 rounded-2xl border border-gray-100 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="relative h-24 w-24 flex-none">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="stroke-gray-100" />
          {score != null && (
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - progress}
              className="stroke-workcofy-yellow transition-[stroke-dashoffset] duration-700 ease-out"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {score != null ? (
            <span className="text-2xl font-extrabold tracking-tight">{score}</span>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Pronto
            </span>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Workcofy Score</h2>
        <p className="mt-1 text-sm text-gray-500">
          {score != null ? scoreLabel(score) : 'Todavía no tenemos suficientes datos de este espacio.'}
        </p>
        {highlights.length > 0 && (
          <p className="mt-1.5 text-xs font-medium text-gray-600">{highlights.join(' · ')}</p>
        )}
      </div>
    </div>
  )
}
