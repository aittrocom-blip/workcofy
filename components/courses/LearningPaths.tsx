import Link from 'next/link'
import { LEARNING_PATHS, START_OPTIONS } from '@/lib/courses/discovery'

// Redesign brief §13–§15: paths by profession, "¿por dónde empiezo?", and the
// bridge to Oportunidades. Every card is a link into existing pages/filters.
export function LearningPaths() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Rutas</span>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">Convierte el conocimiento en oportunidades.</h2>
        <p className="mt-2 max-w-xl text-gray-500">Aprende paso a paso según tu profesión y tus objetivos.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEARNING_PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:border-gray-300"
            >
              <span>
                <span className="block font-semibold tracking-tight">{path.label}</span>
                {path.description && <span className="mt-0.5 block text-xs text-gray-500">{path.description}</span>}
              </span>
              <span aria-hidden="true" className="text-gray-300 transition-colors group-hover:text-black">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <div className="rounded-[32px] border border-gray-100 bg-gray-50 p-6 md:p-10">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">¿No sabes por dónde empezar?</h2>
          <p className="mt-2 max-w-xl text-gray-500">Encuentra recursos según tu nivel, profesión y objetivos.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {START_OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-black"
              >
                <span className="font-semibold tracking-tight">{option.label}</span>
                {option.description && <span className="mt-1 text-xs text-gray-500">{option.description}</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-col gap-4 rounded-[32px] bg-black px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Aprende → Oportunidades</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">Aprender IA puede abrir nuevas oportunidades.</h2>
            <p className="mt-1 text-sm text-gray-300">Las habilidades que desarrollas aquí aparecen cada vez más en las vacantes.</p>
          </div>
          <Link
            href="/oportunidades/ia"
            className="inline-flex flex-none items-center justify-center rounded-full bg-workcofy-yellow px-5 py-3 text-sm font-semibold text-black transition-all hover:shadow-md active:scale-[0.97]"
          >
            Explorar oportunidades con IA →
          </Link>
        </div>
      </section>
    </>
  )
}
