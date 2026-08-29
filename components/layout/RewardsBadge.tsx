'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function RewardsBadge() {
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

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/w-coins.png" alt="" className="h-3.5 w-3.5" />
      {balance}
    </span>
  )
}
