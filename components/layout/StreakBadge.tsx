'use client'

import { useDailyStreak } from '@/lib/hooks/useDailyStreak'

interface StreakBadgeProps {
  size?: 'sm' | 'lg'
}

// Sits next to RewardsBadge — visible from day one (even "🔥 1") so the
// mechanic itself is what prompts a user to come back tomorrow, not
// something that only appears once they've already built a habit.
export function StreakBadge({ size = 'sm' }: StreakBadgeProps) {
  const streak = useDailyStreak()
  if (!streak) return null

  if (size === 'lg') {
    return (
      <span className="flex items-center gap-1.5 text-lg font-bold text-workcofy-black" title={`${streak.longest} días seguidos (récord)`}>
        🔥 {streak.streak}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[15px] font-semibold text-[#252A32]"
      title={`${streak.longest} días seguidos (récord)`}
    >
      🔥 {streak.streak}
    </span>
  )
}
