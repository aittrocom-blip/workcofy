import Link from 'next/link'

interface Pillar {
  icon: string
  title: string
  text: string
  cta: string
  href: string | null
}

// Master spec §7. Eventos is listed but not linked (out of the validation MVP).
const PILLARS: Pillar[] = [
  {
    icon: '/icons/nav-explorar.png',
    title: 'Espacios',
    text: 'Descubre cafeterías, coworkings, hoteles, bibliotecas y otros lugares donde puedes trabajar.',
    cta: 'Encontrar un espacio',
    href: '/espacios',
  },
  {
    icon: '/icons/nav-equipos.png',
    title: 'Trabajos remotos',
    text: 'Encuentra trabajos remotos, proyectos, oportunidades freelance y nuevas formas de trabajar.',
    cta: 'Explorar oportunidades',
    href: '/oportunidades',
  },
  {
    icon: '/icons/event-laptop.png',
    title: 'Aprende',
    text: 'Desarrolla nuevas habilidades y aprende a utilizar la inteligencia artificial en tu trabajo.',
    cta: 'Aprender',
    href: '/aprende',
  },
  {
    icon: '/icons/nav-eventos.png',
    title: 'Eventos',
    text: 'Participa en workshops, AI Sessions, networking y encuentros para aprender y conectar.',
    cta: 'Ver eventos',
    href: null,
  },
]

export function PillarsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <h2 className="text-center text-2xl font-bold tracking-tight md:text-4xl">
        Encuentra lo que necesitas para trabajar mejor
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col rounded-3xl border border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pillar.icon} alt="" className="h-6 w-6" />
              <h3 className="text-lg font-bold tracking-tight">{pillar.title}</h3>
              {pillar.href === null && (
                <span className="ml-auto rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  Próximamente
                </span>
              )}
            </div>
            <p className="mt-3 flex-1 text-sm text-gray-600">{pillar.text}</p>
            {pillar.href ? (
              <Link
                href={pillar.href}
                className="mt-5 inline-block w-fit rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
              >
                {pillar.cta}
              </Link>
            ) : (
              <span className="mt-5 inline-block w-fit cursor-not-allowed rounded-full bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-400">
                {pillar.cta}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
