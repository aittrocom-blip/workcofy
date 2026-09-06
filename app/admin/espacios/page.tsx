import { listSpaces } from '@/lib/data/spaces'
import { AdminEspaciosList } from './AdminEspaciosList'

export const dynamic = 'force-dynamic'

export default async function AdminEspaciosPage() {
  const spaces = await listSpaces()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Espacios</h1>
      <p className="mt-1 text-sm text-gray-500">{spaces.length} espacios activos</p>

      <AdminEspaciosList spaces={spaces} />
    </div>
  )
}
