import Link from 'next/link'
import { getOpportunityClickStats } from '@/lib/data/opportunities'
import { getCourseClickStats } from '@/lib/data/courses'

export const dynamic = 'force-dynamic'

const ROW = 'flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-2.5 text-sm'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold">{value.toLocaleString('es-PE')}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{label}</p>
    </div>
  )
}

// Read-only view of click_count for opportunities and courses — the metric
// that matters for validating the business model (master spec §44). Shares
// aren't tracked here: ShareButton fires a Vercel Analytics event instead,
// visible in the project's Analytics tab on vercel.com.
export default async function AdminEstadisticasPage() {
  const [opportunities, courses] = await Promise.all([getOpportunityClickStats(20), getCourseClickStats(20)])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
      <p className="mt-1 text-sm text-gray-500">
        Clics en "Ver oportunidad" / "Ver curso". Los compartidos se ven en Vercel → Analytics → Events.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Oportunidades publicadas" value={opportunities.totalPublished} />
        <StatTile label="Clics en oportunidades" value={opportunities.totalClicks} />
        <StatTile label="Cursos publicados" value={courses.totalPublished} />
        <StatTile label="Clics en cursos" value={courses.totalClicks} />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Oportunidades más clicadas</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {opportunities.top.map((row, index) => (
            <li key={row.id} className={ROW}>
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-5 flex-none text-right text-xs text-gray-400">{index + 1}</span>
                <Link href={`/oportunidades/${row.slug}`} className="truncate font-medium hover:underline">
                  {row.title}
                </Link>
                <span className="flex-none truncate text-gray-400">{row.company}</span>
              </span>
              <span className="flex-none font-semibold">{row.click_count}</span>
            </li>
          ))}
          {opportunities.top.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Sin datos todavía.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Cursos más clicados</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {courses.top.map((row, index) => (
            <li key={row.id} className={ROW}>
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-5 flex-none text-right text-xs text-gray-400">{index + 1}</span>
                <span className="truncate font-medium">{row.title}</span>
                <span className="flex-none truncate text-gray-400">{row.provider}</span>
              </span>
              <span className="flex-none font-semibold">{row.click_count}</span>
            </li>
          ))}
          {courses.top.length === 0 && <p className="py-6 text-center text-sm text-gray-500">Sin datos todavía.</p>}
        </ul>
      </section>
    </div>
  )
}
