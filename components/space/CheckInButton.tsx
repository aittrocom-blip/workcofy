'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface CheckInButtonProps {
  spaceId: string
  className?: string
}

type Status = 'idle' | 'locating' | 'saving' | 'done' | 'already' | 'too_far' | 'error'

interface CheckInRpcResult {
  success: boolean
  message: string
  coins_awarded: number
}

// "Estuve aquí" backed by real GPS proximity — the checkin_at_space() RPC
// (0020_space_checkins.sql) rejects it server-side if the browser's reported
// coordinates aren't within ~150m of the space, so this can't be farmed by
// just clicking the button from home.
export function CheckInButton({ spaceId, className = '' }: CheckInButtonProps) {
  const pathname = usePathname()
  const { user } = useAuthUser()
  const [status, setStatus] = useState<Status>('idle')
  const [coins, setCoins] = useState(0)

  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={className}>
        📍 Estuve aquí
      </Link>
    )
  }

  function handleClick() {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('saving')
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await supabase.rpc('checkin_at_space', {
          p_space_id: spaceId,
          p_lat: position.coords.latitude,
          p_lng: position.coords.longitude,
        })
        const result = (data as CheckInRpcResult[] | null)?.[0]
        if (error || !result) {
          setStatus('error')
          return
        }
        if (result.success) {
          setCoins(result.coins_awarded)
          setStatus('done')
          window.dispatchEvent(new Event('workcofy:reward-earned'))
          return
        }
        setStatus(result.message === 'too_far' ? 'too_far' : result.message === 'already_checked_in_today' ? 'already' : result.message === 'daily_checkin_limit' ? 'already' : 'error')
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  if (status === 'done') {
    return <span className={`${className} pointer-events-none`}>✓ Beneficio desbloqueado{coins > 0 ? ` · +${coins} W Coins` : ''}</span>
  }

  if (status === 'already') {
    return <span className={`${className} pointer-events-none`}>✓ Beneficio ya desbloqueado hoy</span>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'locating' || status === 'saving'}
      className={`${className} disabled:opacity-60`}
    >
      {status === 'locating'
        ? 'Ubicándote…'
        : status === 'saving'
          ? 'Guardando…'
          : status === 'too_far'
            ? 'Estás lejos — reintentar'
            : status === 'error'
              ? 'No se pudo — reintentar'
              : 'Desbloquear beneficio'}
    </button>
  )
}
