import Image from 'next/image'
import Link from 'next/link'
import { SEARCH_EXAMPLES } from '@/lib/courses/discovery'

const BENEFITS = [
  { title: 'Contenido oficial', text: 'De fuentes confiables.' },
  { title: 'Aplicado al trabajo', text: 'Aprende habilidades que puedes utilizar.' },
  { title: 'Todos los niveles', text: 'Desde principiante hasta avanzado.' },
]

// Redesign brief §4–§6: inspirational hero, three benefits, and the search
// box as the main element. The search is a plain GET form into /aprende.
export function AprendeHero({ currentQuery }: { currentQuery: string | null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
      <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Aprende</span>
          <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Aprende hoy para las oportunidades de mañana.
          </h1>
          <p className="mt-4 max-w-lg text-base text-gray-600 md:text-lg">
            Desarrolla nuevas habilidades y aprende a utilizar la inteligencia artificial en tu trabajo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#cursos"
              className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
            >
              Explorar cursos
            </Link>
            <Link
              href="/aprende/ia-desde-cero"
              className="inline-flex items-center rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]"
            >
              Explorar IA
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px]">
          <Image
            src="/section-aprende.png"
            alt="Una persona aprendiendo y trabajando con su laptop"
            width={1536}
            height={1024}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{benefit.title}</p>
            <p className="mt-1 text-sm font-medium text-gray-800">{benefit.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_16px_38px_rgba(0,0,0,0.05)] md:p-8">
        <label htmlFor="aprende-search" className="text-xl font-bold tracking-tight md:text-2xl">
          ¿Qué quieres aprender?
        </label>
        <form action="/aprende" method="get" className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="aprende-search"
            type="search"
            name="q"
            defaultValue={currentQuery ?? ''}
            placeholder="Buscar cursos, herramientas o habilidades..."
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
