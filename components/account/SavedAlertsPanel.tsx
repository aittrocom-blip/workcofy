'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export interface SavedAlertSummary {
  id: string
  label: string
  created_at: string
}

// Server-fetched list (RLS already scopes it to the viewer) with a client
// delete button — same split as CourseFavoritesProvider/LikeButton: reads
// happen server-side, writes go straight through the browser client.
export function SavedAlertsPanel({ alerts }: { alerts: SavedAlertSummary[] }) {
  const [items, setItems] = useState(alerts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.from('saved_opportunity_alerts').delete().eq('id', id)
    setDeletingId(null)
    if (!error) setItems((current) => current.filter((item) => item.id !== id))
  }

  if (items.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-bold text-black">Mis alertas de oportunidades</h2>
        <p className="mt-2 text-sm text-gray-500">
          Aún no guardaste ninguna. Ve a{' '}
          <a href="/oportunidades" className="font-semibold text-black underline">
            Trabajos remotos
          </a>{' '}
          y usa el botón “🔔 Guardar alerta” con los filtros que te interesen.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-black">Mis alertas de oportunidades</h2>
      <p className="mt-1 text-sm text-gray-500">Te avisamos por correo cuando aparezca algo nuevo que coincida.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((alert) => (
          <li
            key={alert.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <span className="min-w-0 truncate text-sm font-semibold text-black">{alert.label}</span>
            <button
              type="button"
              onClick={() => handleDelete(alert.id)}
              disabled={deletingId === alert.id}
              className="flex-none rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 disabled:opacity-60"
            >
              {deletingId === alert.id ? 'Borrando…' : 'Borrar'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
