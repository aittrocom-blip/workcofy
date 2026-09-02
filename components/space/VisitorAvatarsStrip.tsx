import { pickExampleVisitors } from '@/lib/mockUsers'
import { avatarFor } from '@/lib/avatars'

interface VisitorAvatarsStripProps {
  spaceId: string
}

// Quick "who's been here" glance shown above the space name — seeded by
// spaceId so the same space always shows the same example visitors. Uses
// the same illustrated avatar art as the "Cerca de ti" widget on the
// Espacios dashboard, for visual consistency across the app.
export function VisitorAvatarsStrip({ spaceId }: VisitorAvatarsStripProps) {
  const visitors = pickExampleVisitors(spaceId)

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visitors.map((visitor) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={visitor.initials + visitor.daysAgo}
            src={avatarFor(visitor.avatarId).src}
            alt=""
            title={`${visitor.name} (ejemplo)`}
            className="h-6 w-6 flex-none rounded-full border-2 border-white bg-gray-50 object-cover"
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {visitors[0].name.split(' ')[0]} y otros estuvieron aquí hace {visitors[0].daysAgo}{' '}
        {visitors[0].daysAgo === 1 ? 'día' : 'días'} <span className="italic">(ejemplo)</span>
      </p>
    </div>
  )
}
