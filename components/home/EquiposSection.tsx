import Image from 'next/image'

const BULLETS = [
  'Encuentra lugares para reuniones',
  'Organiza encuentros de equipo',
  'Descubre espacios cerca de todos',
  'Trabaja fuera de la oficina',
  'Coordina actividades',
]

export function EquiposSection() {
  return (
    <section id="equipos" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 sm:p-8 md:p-12">
        <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">02 — Equipos</span>
              <span className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                Próximamente
              </span>
            </div>
            <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
              Trabajar juntos no significa trabajar en el mismo lugar.
            </h2>
            <p className="mt-3 max-w-xl text-gray-500">
              Crea equipos y encuentra espacios que funcionen para todos — para empresas,
              startups y equipos híbridos.
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-gray-300" />
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-semibold">Workcofy para equipos que trabajan diferente.</p>
            <span
              className="mt-4 inline-flex cursor-not-allowed items-center rounded-full border border-dashed border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-400"
              title="Próximamente"
            >
              Descubre Workcofy para equipos
            </span>
          </div>

          <div className="w-full flex-1 overflow-hidden rounded-3xl">
            <Image
              src="/section-equipos.png"
              alt="Equipos coordinando espacios de trabajo con Workcofy"
              width={1536}
              height={1024}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
