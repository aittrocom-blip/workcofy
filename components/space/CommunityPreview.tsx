import { pickExampleVisitors } from '@/lib/mockUsers'

interface CommunityPreviewProps {
  spaceId: string
}

// Shows what the future "who visited this space" Comunidad feature will
// look like, using clearly-labeled example people — never real activity,
// since there's no accounts/check-in system yet to back real data.
export function CommunityPreview({ spaceId }: CommunityPreviewProps) {
  const visitors = pickExampleVisitors(spaceId)

  return (
    <div className="mt-10 rounded-2xl border border-dashed border-gray-200 p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Comentarios de la comunidad</h3>
        <span className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
          Vista previa · datos de ejemplo
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Próximamente vas a poder ver quién visitó este espacio y leer sus comentarios. Así se vería:
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex -space-x-2">
          {visitors.map((visitor) => (
            <span
              key={visitor.initials + visitor.daysAgo}
              title={`${visitor.name} (ejemplo)`}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 border-white text-xs font-bold ${visitor.colorClass}`}
            >
              {visitor.initials}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {visitors[0].name.split(' ')[0]} y otros estuvieron aquí hace {visitors[0].daysAgo}{' '}
          {visitors[0].daysAgo === 1 ? 'día' : 'días'} <span className="italic">(ejemplo)</span>
        </p>
      </div>
    </div>
  )
}
