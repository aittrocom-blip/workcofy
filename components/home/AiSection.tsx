import Link from 'next/link'

// Master spec §31.
export function AiSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-3xl bg-black px-5 py-10 text-white sm:px-8 md:px-12 md:py-14">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
          La inteligencia artificial está cambiando la forma en que trabajamos.
        </h2>
        <p className="mt-4 max-w-2xl text-gray-300">
          Aprende a utilizarla, descubre nuevas oportunidades y desarrolla habilidades que te permitan adaptarte
          al nuevo mundo laboral.
        </p>
        <Link
          href="/aprende"
          className="mt-6 inline-block rounded-full bg-workcofy-yellow px-6 py-2.5 text-sm font-semibold text-black transition-all hover:shadow-md active:scale-[0.97]"
        >
          Explorar aprendizaje
        </Link>
      </div>
    </section>
  )
}
