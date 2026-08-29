'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL } from '@/lib/rewards/constants'

interface CartaEspecialSectionProps {
  content: string | null
}

export function CartaEspecialSection({ content }: CartaEspecialSectionProps) {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [completedThisMonth, setCompletedThisMonth] = useState(0)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadStatus(uid: string | null) {
      if (!uid) {
        setCompletedThisMonth(0)
        setLoaded(true)
        return
      }
      const now = new Date()
      const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
      const { count } = await supabase
        .from('mission_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('completed_at', startOfMonthUtc)
      setCompletedThisMonth(count ?? 0)
      setLoaded(true)
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadStatus(data.user?.id ?? null)
    })

    function handleRewardEarned() {
      supabase.auth.getUser().then(({ data }) => loadStatus(data.user?.id ?? null))
    }
    window.addEventListener('workcofy:reward-earned', handleRewardEarned)

    return () => {
      window.removeEventListener('workcofy:reward-earned', handleRewardEarned)
    }
  }, [])

  if (!loaded) return null

  const unlocked = completedThisMonth >= MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL
  const remaining = MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL - completedThisMonth

  return (
    <div className="mt-8 rounded-2xl border border-workcofy-yellow/40 bg-workcofy-yellow/5 p-5">
      <h3 className="text-sm font-semibold tracking-tight">Carta especial</h3>
      {!userId ? (
        <p className="mt-2 text-sm text-gray-500">
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="font-semibold text-black hover:underline"
          >
            Inicia sesión
          </Link>{' '}
          y completa misiones para desbloquear la carta especial de este espacio.
        </p>
      ) : unlocked ? (
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{content}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Completa {remaining} misión{remaining === 1 ? '' : 'es'} más este mes en{' '}
          <Link href="/perfil" className="font-semibold text-black hover:underline">
            tu perfil
          </Link>{' '}
          para desbloquear la carta especial.
        </p>
      )}
    </div>
  )
}
