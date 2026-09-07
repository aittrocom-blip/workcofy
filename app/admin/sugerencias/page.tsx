import { listSpaceSuggestions } from '@/lib/data/spaceSuggestions'
import { AdminSuggestionsList } from './AdminSuggestionsList'

export const dynamic = 'force-dynamic'

export default async function AdminSugerenciasPage() {
  const suggestions = await listSpaceSuggestions()
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Sugerencias</h1>
      <p className="mt-1 text-sm text-gray-500">
        {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'} de {suggestions.length} en total
      </p>

      <AdminSuggestionsList suggestions={suggestions} />
    </div>
  )
}
