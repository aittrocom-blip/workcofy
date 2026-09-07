import Link from 'next/link'
import Image from 'next/image'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

const PRIMARY =
  'inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]'
const SECONDARY =
  'inline-flex items-center gap-2 rounded-full border border-black bg-white px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]'

// The illustration stays: it shows the product without repeating the headline.
export function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center md:px-8 md:pt-14">
      <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
        Trabaja. Aprende. Conecta.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 md:text-lg">
        Encuentra oportunidades, desarrolla nuevas habilidades y descubre espacios para crecer
        profesionalmente en la era de la IA.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/oportunidades" className={PRIMARY}>
          Explorar oportunidades
        </Link>
        {LAUNCH_LOCKED ? (
          <span
            title="Próximamente"
            className="inline-flex cursor-not-allowed items-center rounded-full bg-gray-200 px-8 py-3.5 text-base font-semibold text-gray-400"
          >
            Encontrar un Spot
          </span>
        ) : (
          <Link href="/espacios" className={SECONDARY}>
            Encontrar un Spot
          </Link>
        )}
      </div>

      <div className="relative mt-10">
        <Image
          src="/hero-bg.png"
          alt="Workcofy — trabaja mejor desde cualquier lugar"
          width={1672}
          height={847}
          priority
          className="h-auto w-full"
        />
      </div>
    </div>
  )
}
