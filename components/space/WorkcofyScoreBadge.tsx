interface WorkcofyScoreBadgeProps {
  score: number | null
}

export function WorkcofyScoreBadge({ score }: WorkcofyScoreBadgeProps) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-100 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h2 className="text-sm font-semibold tracking-tight">Workcofy Score</h2>
      {score != null ? (
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{score}/100</p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Workcofy Score próximamente</p>
      )}
    </div>
  )
}
