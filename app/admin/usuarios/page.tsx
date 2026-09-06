import { listUsers } from '@/lib/data/users'
import { avatarFor } from '@/lib/avatars'
import { countryLabel } from '@/lib/countries'

export const dynamic = 'force-dynamic'

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminUsuariosPage() {
  const users = await listUsers()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
      <p className="mt-1 text-sm text-gray-500">{users.length} usuarios registrados</p>

      <ul className="mt-6 flex flex-col gap-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarFor(user.avatarId).src}
              alt=""
              className="h-10 w-10 flex-none rounded-full bg-gray-50 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{user.name ?? 'Sin nombre'}</span>
                {user.isAdmin && (
                  <span className="rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-semibold text-black">
                    Admin
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500">{user.email ?? 'Sin email'}</p>
            </div>
            <div className="flex-none text-right text-xs text-gray-400">
              {user.city && user.country ? (
                <p>
                  {user.city}, {countryLabel(user.country)}
                </p>
              ) : (
                user.country && <p>{countryLabel(user.country)}</p>
              )}
              <p>Desde {formatJoinDate(user.createdAt)}</p>
            </div>
          </li>
        ))}
        {users.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">Todavía no hay usuarios registrados.</p>
        )}
      </ul>
    </div>
  )
}
