import Image from 'next/image'

const BULLETS = [
  'Encuentra oportunidades freelance',
  'Descubre proyectos específicos',
  'Conecta con empresas y startups',
  'Encuentra trabajos cerca de ti',
  'Publica tus propios proyectos',
  'Colabora con otros profesionales',
]

export function EquiposSection() {
  return (
    <section id="equipos" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 sm:p-8 md:p-12">
        <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">02 — Trabajo</span>
              <span className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                Próximamente
              </span>
            </div>
            <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
              Trabajar diferente significa encontrar nuevas oportunidades.
            </h2>
            <p className="mt-3 max-w-xl text-gray-500">
              Descubre proyectos, trabajos y colaboraciones que se adaptan a lo que sabes hacer — estés
              donde estés y trabajes como trabajes.
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-gray-300" />
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-semibold">Workcofy para quienes trabajan diferente.</p>
          </div>

          <div className="w-full flex-1 overflow-hidden rounded-3xl">
            <Image
              src="/section-trabajo.png"
              alt="Oportunidades de trabajo y proyectos freelance cerca de ti en Workcofy"
              width={1535}
              height={1024}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
