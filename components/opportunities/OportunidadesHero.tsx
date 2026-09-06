import Link from 'next/link'
import { SEARCH_EXAMPLES } from '@/lib/opportunities/discovery'

// Redesign brief §2, §4, §5: an inspirational hero built around one big
// search box, not a database-style header.
export function OportunidadesHero({ currentQuery }: { currentQuery: string | null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Oportunidades</span>
      <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Encuentra tu próxima oportunidad.
      </h1>
      <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
        Trabajo remoto, freelance, proyectos y prácticas de Perú, Latinoamérica y el mundo.
      </p>

      <div className="mt-8 rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.05)] md:p-8">
        <label htmlFor="oportunidades-search" className="text-xl font-bold tracking-tight md:text-2xl">
          ¿Qué estás buscando?
        </label>
        <form action="/oportunidades" method="get" className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="oportunidades-search"
            type="search"
            name="q"
            defaultValue={currentQuery ?? ''}
            placeholder="Buscar por puesto, habilidad o empresa..."
            className="min-w-0 flex-1 rounded-full border border-gray-200 px-5 py-3.5 text-base outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            Buscar
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Ejemplos:</span>
          {SEARCH_EXAMPLES.map((example) => (
            <Link
              key={example.label}
              href={example.href}
              className="rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-700 transition-colors hover:border-black"
            >
              {example.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
