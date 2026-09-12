'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface CheckInButtonProps {
  spaceId: string
  className?: string
  demoCoordinates?: { lat: number; lng: number }
  spaceName?: string
  benefitLabel?: string
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
export function CheckInButton({ spaceId, className = '', demoCoordinates, spaceName = 'Este local', benefitLabel = 'Beneficio del local' }: CheckInButtonProps) {
  const pathname = usePathname()
  const { user } = useAuthUser()
  const [status, setStatus] = useState<Status>('idle')
  const [coins, setCoins] = useState(0)
  const [activationCode, setActivationCode] = useState('')
  const [activatedAt, setActivatedAt] = useState<Date | null>(null)

  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={className}>
        📍 Estuve aquí
      </Link>
    )
  }

  function handleClick() {
    if (demoCoordinates) {
      void saveCheckIn(demoCoordinates.lat, demoCoordinates.lng)
      return
    }
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await saveCheckIn(position.coords.latitude, position.coords.longitude)
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  async function saveCheckIn(lat: number, lng: number) {
    setStatus('saving')
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('checkin_at_space', {
      p_space_id: spaceId,
      p_lat: lat,
      p_lng: lng,
    })
        const result = (data as CheckInRpcResult[] | null)?.[0]
        if (error || !result) {
          setStatus('error')
          return
        }
        if (result.success) {
          setCoins(result.coins_awarded)
          setActivationCode(String(Math.floor(100000 + Math.random() * 900000)))
          setActivatedAt(new Date())
          setStatus('done')
          window.dispatchEvent(new Event('workcofy:reward-earned'))
          return
        }
        setStatus(result.message === 'too_far' ? 'too_far' : result.message === 'already_checked_in_today' ? 'already' : result.message === 'daily_checkin_limit' ? 'already' : 'error')
  }

  if (status === 'done') {
    const expiresAt = activatedAt ? new Date(activatedAt.getTime() + 60 * 60 * 1000) : null
    const formatTime = (date: Date | null) => date?.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' }) ?? '--'
    return <div className="w-full rounded-3xl bg-workcofy-yellow p-5 text-black shadow-lg shadow-workcofy-yellow/20">
      <div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Beneficio activo</p><span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">ACTIVO</span></div>
      <h3 className="mt-3 text-xl font-extrabold tracking-tight">{benefitLabel}</h3>
      <p className="mt-1 text-sm font-semibold text-black/65">{spaceName}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/10 pt-3 text-xs"><div><p className="text-black/50">Usuario</p><p className="font-bold">@{user.user_metadata?.user_name ?? user.email?.split('@')[0] ?? 'miembro'}</p></div><div><p className="text-black/50">ID</p><p className="font-bold">WK-{user.id.slice(0, 6).toUpperCase()}</p></div><div><p className="text-black/50">Activado</p><p className="font-bold">{formatTime(activatedAt)}</p></div><div><p className="text-black/50">Válido hasta</p><p className="font-bold">{formatTime(expiresAt)}</p></div></div>
      <div className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">Código para validar en caja</p><p className="mt-1 text-2xl font-black tracking-[0.25em]">{activationCode}</p></div>
      {coins > 0 && <p className="mt-3 text-center text-xs font-bold">También ganaste +{coins} W Coins</p>}
    </div>
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
