'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import type { OpportunityFilters } from '@/lib/opportunities/queryBuilder'

interface SaveAlertButtonProps {
  /** The active OpportunityFilters — stored as-is and replayed by the cron straight into listPublishedOpportunities(). */
  filters: OpportunityFilters
  /** Human-readable summary of the active filters, used as the alert's label and in its emails. */
  label: string
}

type Status = 'idle' | 'saving' | 'saved' | 'duplicate' | 'error'

// Bell icon button next to the sort control — saves the filters currently
// applied to /oportunidades as a standing alert. Mirrors LikeButton/
// CourseFavoriteButton: unauthenticated users get a login link, logged-in
// users write straight to the table via the browser client (RLS scopes the
// insert to auth.uid()).
export function SaveAlertButton({ filters, label }: SaveAlertButtonProps) {
  const pathname = usePathname()
  const { user } = useAuthUser()
  const [status, setStatus] = useState<Status>('idle')

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black"
      >
        🔔 Guardar alerta
      </Link>
    )
  }

  async function handleClick() {
    setStatus('saving')
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.from('saved_opportunity_alerts').insert({
      user_id: user!.id,
      label,
      filters,
      // Seeded to "now" so the first cron pass only emails about
      // opportunities published after this moment, not everything that
      // already matched when the alert was saved.
      last_notified_at: new Date().toISOString(),
    })
    if (!error) {
      setStatus('saved')
      return
    }
    setStatus(error.code === '23505' ? 'duplicate' : 'error')
  }

  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-workcofy-green/40 bg-workcofy-green/10 px-3 py-1.5 text-xs font-semibold text-workcofy-green">
        ✓ Te avisaremos por correo
      </span>
    )
  }

  if (status === 'duplicate') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
        Ya tienes esta alerta guardada
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'saving'}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black disabled:opacity-60"
    >
      {status === 'saving' ? 'Guardando…' : status === 'error' ? 'Reintentar' : '🔔 Guardar alerta'}
    </button>
  )
}
