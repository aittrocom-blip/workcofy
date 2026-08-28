import { pickExampleVisitors } from '@/lib/mockUsers'

interface VisitorAvatarsStripProps {
  spaceId: string
}

// Quick "who's been here" glance shown above the space name. Same example
// visitor set as CommunityPreview (seeded by spaceId, so it matches what's
// shown further down that same page) — just trimmed to fit above the title.
export function VisitorAvatarsStrip({ spaceId }: VisitorAvatarsStripProps) {
  const visitors = pickExampleVisitors(spaceId)

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visitors.map((visitor) => (
          <span
            key={visitor.initials + visitor.daysAgo}
            title={`${visitor.name} (ejemplo)`}
            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-white text-[10px] font-bold ${visitor.colorClass}`}
          >
            {visitor.initials}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {visitors[0].name.split(' ')[0]} y otros estuvieron aquí hace {visitors[0].daysAgo}{' '}
        {visitors[0].daysAgo === 1 ? 'día' : 'días'} <span className="italic">(ejemplo)</span>
      </p>
    </div>
  )
}
