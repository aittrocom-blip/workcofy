'use client'

import { useEffect, useState } from 'react'
import { useAuthUser } from './useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export interface DailyStreak {
  streak: number
  longest: number
}

interface StreakRpcResult {
  streak_count: number
  streak_longest: number
}

function todayLimaKey(): string {
  // en-CA gives YYYY-MM-DD directly, no manual formatting needed.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
}

// undefined = not resolved yet, null = logged out. Calls touch_daily_streak()
// at most once per Lima calendar day per browser (cached in localStorage) —
// the RPC is idempotent within a day anyway, this just avoids the extra
// round trip on every page navigation.
export function useDailyStreak(): DailyStreak | null | undefined {
  const { user } = useAuthUser()
  const [state, setState] = useState<DailyStreak | null | undefined>(undefined)

  useEffect(() => {
    if (!user) {
      setState(null)
      return
    }
    const cacheKey = `workcofy_streak_${user.id}`
    const today = todayLimaKey()
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as { date: string; streak: number; longest: number }
        if (parsed.date === today) {
          setState({ streak: parsed.streak, longest: parsed.longest })
          return
        }
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — fall through to the RPC call below.
    }

    const supabase = createBrowserSupabaseClient()
    supabase.rpc('touch_daily_streak').then(({ data }) => {
      const result = (data as StreakRpcResult[] | null)?.[0]
      if (!result) return
      const next = { streak: result.streak_count, longest: result.streak_longest }
      setState(next)
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ date: today, ...next }))
      } catch {
        // best-effort cache only
      }
    })
  }, [user])

  return state
}
