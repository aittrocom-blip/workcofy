interface WorkcofyScoreBadgeProps {
  score: number | null
}

export function WorkcofyScoreBadge({ score }: WorkcofyScoreBadgeProps) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">Workcofy Score</h2>
      {score != null ? (
        <p className="mt-1 text-2xl font-bold">{score}/100</p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Workcofy Score próximamente</p>
      )}
    </div>
  )
}
