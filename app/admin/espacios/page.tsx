import Link from 'next/link'
import { listAllSpacesForAdmin } from '@/lib/data/spaces'
import { AdminEspaciosList } from './AdminEspaciosList'

export const dynamic = 'force-dynamic'

export default async function AdminEspaciosPage() {
  const spaces = await listAllSpacesForAdmin()
  const activeCount = spaces.filter((space) => space.active).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Espacios</h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeCount} activos de {spaces.length} en total
          </p>
        </div>
        <Link
          href="/admin/espacios/nuevo"
          className="flex-none rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
        >
          + Agregar espacio
        </Link>
      </div>

      <AdminEspaciosList spaces={spaces} />
    </div>
  )
}
