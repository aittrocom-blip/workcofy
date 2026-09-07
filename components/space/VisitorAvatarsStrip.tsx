'use client'

import { useEffect, useState } from 'react'
import { pickExampleVisitors, pickRandomVisitors, type ExampleVisitor } from '@/lib/mockUsers'
import { avatarFor } from '@/lib/avatars'

interface VisitorAvatarsStripProps {
  spaceId: string
}

// Quick "who's been here" glance shown above the space name — seeded by
// spaceId on first render (so SSR and the initial client render match), then
// re-rolled on a random interval to give the impression of a community that
// keeps growing instead of a frozen, always-identical trio.
export function VisitorAvatarsStrip({ spaceId }: VisitorAvatarsStripProps) {
  const [visitors, setVisitors] = useState<ExampleVisitor[]>(() => pickExampleVisitors(spaceId))

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = 40_000 + Math.random() * 50_000
      timeoutId = setTimeout(() => {
        setVisitors(pickRandomVisitors(3))
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [spaceId])

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visitors.map((visitor) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={visitor.initials + visitor.daysAgo}
            src={avatarFor(visitor.avatarId).src}
            alt=""
            title={visitor.name}
            className="h-6 w-6 flex-none rounded-full border-2 border-white bg-gray-50 object-cover"
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {visitors[0].name.split(' ')[0]} y otros estuvieron aquí hace {visitors[0].daysAgo}{' '}
        {visitors[0].daysAgo === 1 ? 'día' : 'días'}
      </p>
    </div>
  )
}
