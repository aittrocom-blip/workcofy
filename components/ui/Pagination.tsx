import Link from 'next/link'

interface PaginationProps {
  basePath: string
  current: Record<string, string>
  page: number
  total: number
  pageSize: number
}

function pageHref(basePath: string, current: Record<string, string>, page: number): string {
  const params = new URLSearchParams(current)
  if (page > 1) params.set('page', String(page))
  else params.delete('page')
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

const BUTTON = 'rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-black'

export function Pagination({ basePath, current, page, total, pageSize }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500" aria-label="Paginación">
      {page > 1 && (
        <Link href={pageHref(basePath, current, page - 1)} className={BUTTON}>
          Anterior
        </Link>
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link href={pageHref(basePath, current, page + 1)} className={BUTTON}>
          Siguiente
        </Link>
      )}
    </nav>
  )
}
