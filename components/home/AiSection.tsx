import Image from 'next/image'
import Link from 'next/link'

// Master spec §31. A dark gradient sits between the photo and the text so
// the white copy stays readable regardless of what the banner shows.
export function AiSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="relative overflow-hidden rounded-3xl px-5 py-10 text-white sm:px-8 md:px-12 md:py-14">
        <Image
          src="/section-ia.png"
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 1280px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div className="relative">
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
      </div>
    </section>
  )
}
