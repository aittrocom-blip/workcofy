import Link from 'next/link'
import { listSpaces } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

export default async function AdminEspaciosPage() {
  const spaces = await listSpaces()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Espacios</h1>
      <p className="mt-1 text-sm text-gray-500">{spaces.length} espacios activos</p>

      <ul className="mt-6 flex flex-col gap-2">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              href={`/admin/espacios/${space.slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm hover:border-black"
            >
              <span>
                {space.name}
                <span className="ml-2 text-gray-400">{districtLabel(space.district)}</span>
              </span>
              <span
                className={
                  space.verified
                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500'
                }
              >
                {space.verified ? 'Verificado' : 'Sin verificar'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
