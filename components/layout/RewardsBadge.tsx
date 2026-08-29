'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface RewardsBadgeProps {
  size?: 'sm' | 'lg'
}

export function RewardsBadge({ size = 'sm' }: RewardsBadgeProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadBalance(uid: string | null) {
      if (!uid) {
        setBalance(null)
        return
      }
      const { data } = await supabase.from('reward_events').select('coins').eq('user_id', uid)
      setBalance((data ?? []).reduce((sum, row) => sum + row.coins, 0))
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadBalance(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      loadBalance(uid)
    })

    function handleRewardEarned() {
      supabase.auth.getUser().then(({ data }) => loadBalance(data.user?.id ?? null))
    }
    window.addEventListener('workcofy:reward-earned', handleRewardEarned)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('workcofy:reward-earned', handleRewardEarned)
    }
  }, [])

  if (userId === null || balance === null) return null

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/rewards-coin.png" alt="" className="h-[18px] w-[18px]" />
        <span className="text-lg font-bold text-workcofy-black">{balance}</span>
        <span className="text-xs font-medium text-gray-500">Rewards</span>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/rewards-coin.png" alt="" className="h-3.5 w-3.5" />
      {balance}
    </span>
  )
}
